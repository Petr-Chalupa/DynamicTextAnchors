import AnchorBlock, { SerializedAnchorBlock } from "./AnchorBlock";
import { nodePositionComparator, getNodeFromPath, getPathFromNode, splitArrayToChunks, getAllTextNodes, normalizeString, getConnectingTextNodes } from "./utils";

type SerializedDTA = {
    anchorBlocks: SerializedAnchorBlock[];
};

export default class DTA {
    #rootNode: Element;
    #anchorBlocks: AnchorBlock[] = [];

    constructor(rootNode: Element) {
        this.#rootNode = rootNode;
        rootNode.normalize();
    }

    get rootNode() {
        return this.#rootNode;
    }

    get anchorBlocks() {
        return this.#anchorBlocks;
    }

    createAnchorBlockFromSelection(selection: Selection = window.getSelection()) {
        if (selection.rangeCount === 0 || selection.toString().trim().length === 0) return console.error(new Error("Anchor creation error: Empty selection!"));

        for (let i = 0; i < selection.rangeCount; i++) {
            const range = selection.getRangeAt(i);
            let container = range.commonAncestorContainer;

            while (container.nodeType != Node.ELEMENT_NODE) container = container.parentNode;
            if (!(container.isSameNode(this.#rootNode) || this.#rootNode.contains(container))) {
                console.error(new Error(`Anchor creation error: Invalid selection at range ${i}!`));
                continue;
            }

            const textNodes: Node[] = getAllTextNodes(container)
                .filter((node) => range.intersectsNode(node))
                .map((node) => {
                    const xPath = getPathFromNode(this.#rootNode, node);
                    return /DTA-ANCHOR/gi.test(xPath) ? null : node; // null will signal split between AnchorBlocks
                });
            const ignoreStartOffset = textNodes[0] === null;
            const ignoreEndOffset = textNodes.at(-1) === null;

            const splittedTextNodes: Node[][] = splitArrayToChunks(textNodes, null);
            splittedTextNodes.forEach((chunk, i) => {
                const anchorBlock = new AnchorBlock(this);
                chunk.forEach((textNode, j) => {
                    const startOffset = !ignoreStartOffset && i === 0 && j === 0 ? range.startOffset : 0;
                    const endOffset = !ignoreEndOffset && i === splittedTextNodes.length - 1 && j === chunk.length - 1 ? range.endOffset : textNode.textContent.length;
                    anchorBlock.createAnchor(textNode, startOffset, endOffset);
                });
                if (anchorBlock.anchors.length > 0) this.#anchorBlocks.push(anchorBlock);
            });
        }

        selection.collapseToEnd();
        this.sort();
    }

    removeAnchorBlocks(anchorBlocks: AnchorBlock[] = [...this.#anchorBlocks], destroy: boolean | "remove" = true) {
        anchorBlocks.forEach((anchorBlock) => {
            const anchorBlockIndex = this.#anchorBlocks.findIndex(({ uuid }) => uuid === anchorBlock.uuid);
            anchorBlock.removeAnchors(undefined, destroy);
            this.#anchorBlocks.splice(anchorBlockIndex, 1);
        });
        this.sort();
    }

    getTextNodeContainer(node: Node) {
        for (const anchorBlock of this.#anchorBlocks) {
            for (const anchor of anchorBlock.anchors) {
                if (anchor.firstChild === node) return anchorBlock;
            }
        }
        return null;
    }

    sort() {
        // sort AnchorBlocks by position in document
        this.#anchorBlocks.sort((a, b) => nodePositionComparator(a.anchors.at(-1), b.anchors[0]));
    }

    serialize() {
        const serializedData: SerializedDTA = {
            anchorBlocks: this.#anchorBlocks.map((anchorBlock) => anchorBlock.serialize()),
        };
        return serializedData;
    }

    deserialize(data: SerializedDTA) {
        const invalidAnchors: { anchorBlockData: SerializedAnchorBlock; index: number }[] = [];

        data.anchorBlocks.forEach((anchorBlockData) => {
            const { color, data, anchors } = anchorBlockData;
            const anchorBlock = new AnchorBlock(this);

            anchors.forEach((anchor, index) => {
                const { startOffset, endOffset, xPath, value } = anchor;

                const node = getNodeFromPath(this.#rootNode, xPath)?.singleNodeValue;
                if (!node) {
                    // Anchor can not be inserted due to a missing parent node
                    invalidAnchors.push({ anchorBlockData, index });
                    return;
                }
                const actualValue = node.textContent.substring(startOffset, endOffset);
                if (value != actualValue) {
                    // determine if there was only a soft change - in text case/diacritics/punctuation
                    if (normalizeString(value) === normalizeString(actualValue)) {
                        const createdAnchor = anchorBlock.createAnchor(node, startOffset, endOffset);
                        createdAnchor.setChanged(true);
                    } else {
                        invalidAnchors.push({ anchorBlockData, index });
                        return;
                    }
                }

                anchorBlock.createAnchor(node, startOffset, endOffset);
            });

            if (anchorBlock.anchors.length > 0) {
                anchorBlock.color = color;
                anchorBlock.data = data;
                this.#anchorBlocks.push(anchorBlock);
            }
        });

        invalidAnchors.forEach(({ anchorBlockData, index }) => {
            let { startOffset, xPath, value } = anchorBlockData.anchors[index];
            const anchorBlock = new AnchorBlock(this);

            const searchXPath = `//text()[contains(translate(., "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz"), "${value.toLocaleLowerCase()}")]`; // search is case-insensitive
            const occurences = getNodeFromPath(this.#rootNode, searchXPath, XPathResult.ORDERED_NODE_ITERATOR_TYPE);
            let textNodes: Node[] = [];
            let occurence: Node = null;
            while ((occurence = occurences.iterateNext()) && !/^DTA-ANCHOR$/.test(getPathFromNode(this.#rootNode, occurence))) textNodes.push(occurence); // filter out text nodes inside Anchors
            if (textNodes.length === 0) return; // no match was found

            let node = getNodeFromPath(this.#rootNode, xPath)?.singleNodeValue;
            if (!node || !textNodes.includes(node)) node = textNodes[0]; // select the first node if original parent node does not exist

            startOffset = [...node.textContent.matchAll(new RegExp(value.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&"), "gi"))]
                .map((match) => match.index)
                .reduce((prev, curr) => (Math.abs(curr - startOffset) < Math.abs(prev - startOffset) ? curr : prev)); // select the closest occurence to the startOffset inside the node
            const createdAnchor = anchorBlock.createAnchor(node, startOffset, startOffset + value.length);
            createdAnchor.setChanged(true);

            if (anchorBlock.anchors.length > 0) {
                anchorBlock.color = anchorBlockData.color;
                anchorBlock.data = anchorBlockData.data;
                this.#anchorBlocks.push(anchorBlock);

                // try to reconnect Anchors, that were not in fact separated
                this.sort();
                const connectingTextNodes = getConnectingTextNodes(this.#rootNode, createdAnchor.firstChild);
                if (anchorBlockData.anchors[index - 1] && connectingTextNodes.left) {
                    const leftConnectingAnchorBlock = this.getTextNodeContainer(connectingTextNodes.left);
                    if (leftConnectingAnchorBlock && normalizeString(connectingTextNodes.left.textContent) === normalizeString(anchorBlockData.anchors[index - 1].value)) anchorBlock.merge("left");
                }
                if (anchorBlockData.anchors[index + 1] && connectingTextNodes.right) {
                    const rightConnectingAnchorBlock = this.getTextNodeContainer(connectingTextNodes.right);
                    if (rightConnectingAnchorBlock && normalizeString(connectingTextNodes.right.textContent) === normalizeString(anchorBlockData.anchors[index + 1].value)) anchorBlock.merge("right");
                }
            }
        });

        this.sort();
    }
}
