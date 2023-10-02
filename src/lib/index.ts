export class DTA {
    #rootNode: Element;
    #xmlDoc: Document;

    constructor() {}

    setXML(rootNode: Element, xml: string) {
        if (!rootNode) throw Error("Missing root node!");
        this.#rootNode = rootNode;
        this.#xmlDoc = this.#validateXML(xml);
    }

    #validateXML(xml: string) {
        const xmlDoc: Document = new DOMParser().parseFromString(xml, "text/xml");
        const errNode = xmlDoc.querySelector("parsererror");
        if (errNode) throw Error("Validation error: Invalid XML!");
        return xmlDoc;
    }

    loadAnchors() {
        //load
        return new XMLSerializer().serializeToString(this.#xmlDoc);
    }

    createAnchor(selection: Selection) {
        if (!selection || selection.rangeCount === 0) throw Error("Anchor creation error: Empty selection!");

        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;
        if (!(container.isSameNode(this.#rootNode) || this.#rootNode.contains(container))) throw Error("Anchor creation error: Invalid selection!");

        console.log(selection, range, selection.toString());
        console.log(range.cloneContents());
        const contents = range.cloneContents();

        return `ANCHOR: ${new Date().getTime()}`;
    }
}
