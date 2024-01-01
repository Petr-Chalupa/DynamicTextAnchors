import AnchorBlock, { SerializedAnchorBlock } from "./AnchorBlock";
import { getElFromPath, getPathFromEl, splitArrayToChunks } from "./utils";

type SerializedDTA = {
    anchorBlocks: SerializedAnchorBlock[];
};

export default class DTA {
    #rootNode: Element;
    #anchorBlocks: AnchorBlock[] = [];

    constructor(rootNode: Element) {
        this.#rootNode = rootNode;
    }

    get rootNode() {
        return this.#rootNode;
    }

    get anchorBlocks() {
        return this.#anchorBlocks;
    }

    createAnchorBlockFromSelection(selection: Selection = window.getSelection(), checkValue?: string) {
        const anchorBlocks: AnchorBlock[] = [];

        if (selection.rangeCount === 0 || selection.toString().trim().length === 0) {
            console.error(new Error("Anchor creation error: Empty selection!"));
            return anchorBlocks;
        }

        for (let i = 0; i < selection.rangeCount; i++) {
            const range = selection.getRangeAt(i);
            let container = range.commonAncestorContainer;

            while (container.nodeType != Node.ELEMENT_NODE) container = container.parentNode;
            if (!(container.isSameNode(this.#rootNode) || this.#rootNode.contains(container))) {
                console.error(new Error(`Anchor creation error: Invalid selection at range ${i}!`));
                continue;
            }

            let textNodes: Node[] = [];
            (function traverse(node: Node) {
                if (!range.intersectsNode(node)) return;
                if (node.nodeType === Node.ELEMENT_NODE) {
                    for (const child of node.childNodes) traverse(child);
                } else if (node.nodeType === Node.TEXT_NODE) {
                    textNodes.push(node);
                }
            })(container);

            textNodes = textNodes.map((node) => {
                const xPath = getPathFromEl(this.#rootNode, node);
                return /DTA-ANCHOR/gi.test(xPath) ? null : node;
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
                    anchorBlocks.push(anchorBlock);
                }
            });
        }

        if (checkValue) {
            if (anchorBlocks.length != 1) anchorBlocks.forEach((anchorBlock) => anchorBlock.setChanged(true));
            else if (anchorBlocks[0].value != checkValue) {
                const valueIndexes = anchorBlocks[0].anchors.map((anchor) => {
                    const split = checkValue.split(anchor.value, 2);
                    return split.length === 2 ? [split[0].length, split[0].length + anchor.value.length] : undefined;
                });

                const changedAnchors = [];
                for (let i = 0; i < valueIndexes.length; i++) {
                    const indexes = valueIndexes[i];
                    if (indexes === undefined) {
                        changedAnchors.push(anchorBlocks[0].anchors[i]);
                        i++; // skip the next indexes
                    } else if ((i === 0 && indexes[0] != 0) || (i === valueIndexes.length - 1 && indexes[1] != checkValue.length)) {
                        changedAnchors.push(anchorBlocks[0].anchors[i]);
                    } else if (i != 0 && indexes[0] != valueIndexes[i - 1][1]) {
                        changedAnchors.push(anchorBlocks[0].anchors[i], anchorBlocks[0].anchors[i - 1]);
                    }
                }

                anchorBlocks[0].setChanged(true, changedAnchors);
            }
        }

        this.#anchorBlocks = this.#anchorBlocks.concat(anchorBlocks);
        selection.collapseToEnd();
        return anchorBlocks;
    }

    destroyAnchorBlocks(anchorBlocks: AnchorBlock[] = [...this.#anchorBlocks]) {
        anchorBlocks.forEach((anchorBlock) => {
            const anchorBlockIndex = this.#anchorBlocks.findIndex(({ uuid }) => uuid === anchorBlock.uuid);
            anchorBlock.destroyAnchors();
            this.#anchorBlocks.splice(anchorBlockIndex, 1);
        });
    }

    serialize() {
        const serializedData: SerializedDTA = {
            anchorBlocks: this.#anchorBlocks.map((anchorBlock) => anchorBlock.serialize()),
        };
        return serializedData;
    }

    deserialize(data: SerializedDTA) {
        return data.anchorBlocks.flatMap((anchorBlockData) => {
            const { startAnchor, endAnchor, color, data, value } = anchorBlockData;

            const startNode = getElFromPath(this.#rootNode, startAnchor.xPath);
            const endNode = getElFromPath(this.#rootNode, endAnchor.xPath);
            if (!startNode || !endNode) {
                console.error(new Error("Anchor deserialization error: Missing start or end node!"));
                return;
            }
            if (startAnchor.startOffset > startNode.textContent.length) startAnchor.startOffset = startNode.textContent.length - 5; //random number
            if (endAnchor.endOffset > endNode.textContent.length) endAnchor.endOffset = endNode.textContent.length;

            const range = new Range();
            range.setStart(startNode, startAnchor.startOffset);
            range.setEnd(endNode, endAnchor.endOffset);

            const selection = document.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);

            const anchorBlocks = this.createAnchorBlockFromSelection(selection, value);
            anchorBlocks.forEach((anchorBlock) => {
                anchorBlock.color = color;
                anchorBlock.data = data;
            });
            return anchorBlocks;
        });
    }
}
