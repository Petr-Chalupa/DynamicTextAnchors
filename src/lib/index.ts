export class DTA {
    #rootNode: Element;
    #xmlDoc: Document;
    #wrapTag: Element = document.createElement("mark");

    constructor() {}

    setXML(rootNode: Element, xml: string) {
        if (!rootNode) throw new Error("Missing root node!");
        this.#rootNode = rootNode;
        this.#xmlDoc = this.#validateXML(xml);
    }

    #validateXML(xml: string) {
        const xmlDoc: Document = new DOMParser().parseFromString(xml, "text/xml");
        const errNode = xmlDoc.querySelector("parsererror");
        if (errNode) throw new Error("Validation error: Invalid XML!");
        return xmlDoc;
    }

    setWrapTag(tag: string, options: Object = {}) {
        if (!tag) throw new Error("Missing wrap tag!");
        this.#wrapTag = document.createElement(tag);
        for (const [attr, value] of Object.entries(options)) this.#wrapTag.setAttribute(attr, value);
    }

    loadAnchors() {
        //load
        return new XMLSerializer().serializeToString(this.#xmlDoc);
    }

    createAnchor(selection: Selection) {
        if (!selection || selection.rangeCount === 0) throw new Error("Anchor creation error: Empty selection!");

        const range = selection.getRangeAt(0);
        let container = range.commonAncestorContainer;
        while (container.nodeType != Node.ELEMENT_NODE) container = container.parentNode;
        if (!(container.isSameNode(this.#rootNode) || this.#rootNode.contains(container))) throw new Error("Anchor creation error: Invalid selection!");

        // console.log(selection, range, selection.toString());
        // console.log(range.cloneContents());

        // let startContainer = range.startContainer;
        // while (startContainer.nodeType != Node.ELEMENT_NODE) startContainer = startContainer.parentNode;
        // let endContainer = range.endContainer;
        // while (endContainer.nodeType != Node.ELEMENT_NODE) endContainer = endContainer.parentNode;

        const intersectingTextNodes: Node[] = [];
        const traverse = (node: Node) => {
            if (!range.intersectsNode(node)) return;
            if (node.nodeType === Node.ELEMENT_NODE) {
                for (const child of node.childNodes) traverse(child);
            } else if (node.nodeType === Node.TEXT_NODE) {
                intersectingTextNodes.push(node);
            }
        };
        traverse(container);
        // console.log(intersectingTextNodes);

        intersectingTextNodes.forEach((node, index) => {
            const startOffset = index === 0 ? range.startOffset : 0;
            const endOffset = index === intersectingTextNodes.length - 1 ? range.endOffset : node.textContent.length;
            const partialRange = new Range();
            partialRange.setStart(node, startOffset);
            partialRange.setEnd(node, endOffset);
            partialRange.surroundContents(this.#wrapTag.cloneNode());
        });
        range.collapse();

        return `ANCHOR: ${new Date().getTime()}`;
    }
}
