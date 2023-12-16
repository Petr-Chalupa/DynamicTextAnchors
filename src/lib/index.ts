import AnchorBlock, { SerializedAnchorBlock } from "./AnchorBlock";

interface SerializedDTA {
    // rootNode: Element;
    anchorBlocks: SerializedAnchorBlock[];
}

export default class DTA {
    rootNode: Element;
    anchorBlocks: AnchorBlock[] = [];
    // #xmlDoc: Document;

    constructor(rootNode: Element) {
        this.rootNode = rootNode;
    }

    // setXML(rootNode: Element, xml: string) {
    //     if (!rootNode) throw new Error("Missing root node!");
    //     this.#rootNode = rootNode;
    //     this.#xmlDoc = this.#validateXML(xml);
    // }

    // #validateXML(xml: string) {
    //     const xmlDoc: Document = new DOMParser().parseFromString(xml, "text/xml");
    //     const errNode = xmlDoc.querySelector("parsererror");
    //     if (errNode) throw new Error("Validation error: Invalid XML!");
    //     return xmlDoc;
    // }

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
            const anchorBlock = new AnchorBlock(this.rootNode);
            anchorBlock.deserialize(anchorBlockData);
            return anchorBlock;
        });
    }
}
