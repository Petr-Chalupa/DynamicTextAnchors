interface WrapElement {
    tag: string;
    attributes: { [attr: string]: string };
}

export class DTA {
    #rootNode: Element;
    #xmlDoc: Document;
    #wrapElement: WrapElement = { tag: "mark", attributes: {} };
    anchorBlocks: AnchorBlock[] = [];

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

    setWrapElement(tag: string, attributes: object = {}) {
        if (!tag) throw new Error("Missing wrap element tag!");
        this.#wrapElement.tag = tag;
        Object.assign(this.#wrapElement.attributes, attributes);
    }

    loadAnchors() {
        //load
        return new XMLSerializer().serializeToString(this.#xmlDoc);
    }

    createAnchorBlock(selection: Selection) {
        if (!selection || selection.toString().trim().length === 0 || selection.rangeCount === 0) throw new Error("Anchor creation error: Empty selection!");

        const range = selection.getRangeAt(0);
        let container = range.commonAncestorContainer;
        while (container.nodeType != Node.ELEMENT_NODE) container = container.parentNode;
        if (!(container.isSameNode(this.#rootNode) || this.#rootNode.contains(container))) throw new Error("Anchor creation error: Invalid selection!");

        const anchorBlock = new AnchorBlock(container, range, this.#wrapElement);
        this.anchorBlocks.push(anchorBlock);
        return anchorBlock;
    }
}

class AnchorBlock {
    anchors: Anchor[] = [];
    #value: string = "";

    constructor(container: Node, range: Range, wrapElement: WrapElement) {
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

        intersectingTextNodes.forEach((node, index) => {
            const startOffset = index === 0 ? range.startOffset : 0;
            const endOffset = index === intersectingTextNodes.length - 1 ? range.endOffset : node.textContent.length;

            const anchor = new Anchor(node, startOffset, endOffset, wrapElement);
            if (index > 0) {
                anchor.leftJoin = this.anchors[index - 1];
                this.anchors[index - 1].rightJoin = anchor;
            }
            this.anchors.push(anchor);
            this.#value += anchor.value;
        });

        range.collapse();
    }

    get value() {
        return this.#value;
    }
}

class Anchor {
    uuid: string;
    #value: string;
    startOffset: number;
    endOffset: number;
    #leftJoin: Anchor = null;
    #rightJoin: Anchor = null;

    constructor(node: Node, startOffset: number, endOffset: number, wrapElement: WrapElement) {
        this.uuid = crypto.randomUUID();
        this.#value = node.textContent.substring(startOffset, endOffset);
        this.startOffset = startOffset;
        this.endOffset = endOffset;

        const surroundNode = document.createElement(wrapElement.tag);
        surroundNode.setAttribute("data-uuid", this.uuid);
        for (const [attr, value] of Object.entries(wrapElement.attributes)) surroundNode.setAttribute(attr, value);

        const partialRange = new Range();
        partialRange.setStart(node, this.startOffset);
        partialRange.setEnd(node, this.endOffset);
        partialRange.surroundContents(surroundNode);
    }

    get value() {
        return this.#value;
    }

    set value(value: string) {}

    set leftJoin(leftJoin: Anchor) {
        this.#leftJoin = leftJoin;
    }

    set rightJoin(rightJoin: Anchor) {
        this.#rightJoin = rightJoin;
    }
}
