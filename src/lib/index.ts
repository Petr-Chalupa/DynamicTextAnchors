import AnchorBlock, { SerializedAnchorBlock } from "./AnchorBlock";
import { nodePositionComparator, getNodeFromPath, getPathFromNode, splitArrayToChunks, getAllTextNodes } from "./utils";

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
                if (anchorBlock.anchors.length > 0) {
                    anchorBlock.joinAnchors();
                    this.#anchorBlocks.push(anchorBlock);
                }
            });
        }

        selection.collapseToEnd();
    }

    removeAnchorBlocks(anchorBlocks: AnchorBlock[] = [...this.#anchorBlocks], destroy: boolean | "remove" = true) {
        anchorBlocks.forEach((anchorBlock) => {
            const anchorBlockIndex = this.#anchorBlocks.findIndex(({ uuid }) => uuid === anchorBlock.uuid);
            anchorBlock.removeAnchors(undefined, destroy);
            this.#anchorBlocks.splice(anchorBlockIndex, 1);
        });
    }

    getTextNodeContainer(node: Node) {
        for (const anchorBlock of this.#anchorBlocks) {
            for (const anchor of anchorBlock.anchors) {
                if (anchor.textContent === node.textContent) return anchorBlock;
            }
        }
        return null;
    }

    serialize() {
        const serializedData: SerializedDTA = {
            anchorBlocks: this.#anchorBlocks.sort((a, b) => nodePositionComparator(a.anchors.at(-1), b.anchors[0])).map((anchorBlock) => anchorBlock.serialize()),
        };
        return serializedData;
    }

    deserialize(data: SerializedDTA) {
        data.anchorBlocks.forEach((anchorBlockData) => {
            const { color, data, anchors } = anchorBlockData;

            anchors.forEach((anchor) => {
                let { startOffset, endOffset, xPath, value } = anchor;

                let node = getNodeFromPath(this.#rootNode, xPath)?.singleNodeValue;
                if (!node) return; // Anchor can not be inserted

                const anchorBlock = new AnchorBlock(this);
                anchorBlock.color = color;
                anchorBlock.data = data;
                const createdAnchor = anchorBlock.createAnchor(node, startOffset, endOffset);

                if (!createdAnchor) {
                    const searchXPath = `//text()[contains(translate(., "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz"), "${value.toLocaleLowerCase()}")]`; // search is case-insensitive
                    const occurences = getNodeFromPath(this.#rootNode, searchXPath, XPathResult.ORDERED_NODE_ITERATOR_TYPE);
                    let textNodes: Node[] = [];
                    let occurence: Node = null;
                    while ((occurence = occurences.iterateNext())) textNodes.push(occurence);

                    if (textNodes.includes(node)) {
                        // value is contained inside the same node, but has been moved
                        startOffset = node.textContent.match(new RegExp(value, "i")).index;
                        anchorBlock.createAnchor(node, startOffset, startOffset + value.length);
                    } else {
                        // Anchor must be created in the closest possible node containing the value
                        console.log(textNodes);
                    }
                } else if (createdAnchor.value != value) createdAnchor.setChanged(true);

                if (anchorBlock.anchors.length > 0) {
                    this.#anchorBlocks.push(anchorBlock);
                    anchorBlock.merge("left", false); // try to merge with the previous AnchorBlock
                    anchorBlock.joinAnchors();
                }
            });
        });
    }
}
