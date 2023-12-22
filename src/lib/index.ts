import AnchorBlock, { SerializedAnchorBlock } from "./AnchorBlock";
import { getElFromPath } from "./utils";

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

    destroyAnchorBlock(uuid: string) {
        const index = this.anchorBlocks.findIndex((anchorBlock) => anchorBlock.uuid === uuid);
        this.anchorBlocks[index]?.destroyAnchors();
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
        function searchForOccurences(value: string) {}

        data.anchorBlocks.forEach((anchorBlockData) => {
            const { uuid, anchors, value, color, data } = anchorBlockData;
            const anchorBlock = new AnchorBlock(this.rootNode, null, null, uuid);
            anchorBlock.color = color;
            anchorBlock.data = data;

            anchors.forEach((anchorData) => {
                const { uuid, startOffset, endOffset, xPath } = anchorData;

                const node = getElFromPath(this.rootNode, xPath);
                if (!node) {
                    //search for occurences
                }

                const actualValue = node.textContent.substring(startOffset, endOffset);
                if (actualValue != value) {
                    console.log("Values not matching");
                    //check fo occurences
                }

                return;
                anchorBlock.createAnchor(node, startOffset, endOffset, uuid, xPath);
            });

            if (anchorBlock.anchors.length > 0) this.anchorBlocks.push(anchorBlock);
        });

        //checks
        // function canDeserializeAnchor(node: Node, anchorData: any) {
        //     const { uuid, value, startOffset, endOffset, xPath } = anchorData;

        //     const actualValue = node.textContent.substring(startOffset, endOffset);
        //     if (actualValue != value) return false;

        //     return true;
        // }

        // // this.rootNode = data.rootNode;
        // this.anchorBlocks = data.anchorBlocks.map((anchorBlockData) => {
        //     const anchorBlock = new AnchorBlock(this.rootNode, null, null, anchorBlockData.uuid);
        //     anchorBlock.deserialize(anchorBlockData);
        //     return anchorBlock;
        // });
    }
}
