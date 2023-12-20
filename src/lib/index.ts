import AnchorBlock, { SerializedAnchorBlock } from "./AnchorBlock";

interface SerializedDTA {
    // rootNode: Element;
    anchorBlocks: SerializedAnchorBlock[];
}

export default class DTA {
    rootNode: Element;
    anchorBlocks: AnchorBlock[] = [];

    constructor(rootNode: Element) {
        this.rootNode = rootNode;
    }

    createAnchorBlock(selection: Selection) {
        if (!selection || selection.toString().trim().length === 0 || selection.rangeCount === 0) throw new Error("Anchor creation error: Empty selection!");
        for (let i = 0; i < selection.rangeCount; i++) {
            const range = selection.getRangeAt(i);
            let container = range.commonAncestorContainer;
            while (container.nodeType != Node.ELEMENT_NODE) container = container.parentNode;
            if (!(container.isSameNode(this.rootNode) || this.rootNode.contains(container))) throw new Error(`Anchor creation error: Invalid selection at range ${i}!`);

            const anchorBlock = new AnchorBlock(this.rootNode, container, range);
            this.anchorBlocks.push(anchorBlock);
        }
    }

    removeAnchorBlock(uuid: string) {
        const index = this.anchorBlocks.findIndex((anchorBlock) => anchorBlock.uuid === uuid);
        this.anchorBlocks[index]?.remove();
        this.anchorBlocks.splice(index, 1);
    }

    serialize() {
        const serializedData: SerializedDTA = {
            // rootNode: getPathFromEl(document.body, this.rootNode),
            anchorBlocks: this.anchorBlocks.map((anchorBlock) => anchorBlock.serialize()),
        };
        return serializedData;
    }

    deserialize(data: SerializedDTA) {
        // this.rootNode = data.rootNode;
        this.anchorBlocks = data.anchorBlocks.map((anchorBlockData) => {
            const anchorBlock = new AnchorBlock(this.rootNode, null, null, anchorBlockData.uuid);
            anchorBlock.deserialize(anchorBlockData);
            return anchorBlock;
        });
    }
}
