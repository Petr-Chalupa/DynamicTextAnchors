interface WrapElement {
    tag: string;
    attributes: { [attr: string]: string };
}

interface Props {
    color: string;
    data: object;
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

    saveAnchors() {}

    loadAnchors() {
        //load
        return new XMLSerializer().serializeToString(this.#xmlDoc);
    }

    createAnchorBlock(selection: Selection) {
        if (!selection || selection.toString().trim().length === 0 || selection.rangeCount === 0) throw new Error("Anchor creation error: Empty selection!");
        for (let i = 0; i < selection.rangeCount; i++) {
            const range = selection.getRangeAt(i);
            let container = range.commonAncestorContainer;
            while (container.nodeType != Node.ELEMENT_NODE) container = container.parentNode;
            if (!(container.isSameNode(this.#rootNode) || this.#rootNode.contains(container))) throw new Error(`Anchor creation error: Invalid selection at range ${i}!`);

            const anchorBlock = new AnchorBlock(container, range, this.#wrapElement);
            this.anchorBlocks.push(anchorBlock);
        }
    }
}

class AnchorBlock {
    anchors: Anchor[] = [];
    #value: string = "";
    props: Props = { color: "#ffff00", data: {} };

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
    #surroundNode: Element;

    constructor(node: Node, startOffset: number, endOffset: number, wrapElement: WrapElement) {
        this.uuid = crypto.randomUUID();
        this.#value = node.textContent.substring(startOffset, endOffset);
        this.startOffset = startOffset;
        this.endOffset = endOffset;

        this.#surroundNode = document.createElement(wrapElement.tag);
        this.#surroundNode.setAttribute("data-uuid", this.uuid);
        this.#surroundNode.setAttribute("tabindex", "0");
        for (const [attr, value] of Object.entries(wrapElement.attributes)) this.#surroundNode.setAttribute(attr, value);

        const partialRange = new Range();
        partialRange.setStart(node, this.startOffset);
        partialRange.setEnd(node, this.endOffset);
        partialRange.surroundContents(this.#surroundNode);

        this.#surroundNode.addEventListener("click", (e) => {
            const anchorCustomEvent = new CustomEvent("anchor-click", { bubbles: true, detail: { originalEvent: e, anchor: this } });
            this.#surroundNode.dispatchEvent(anchorCustomEvent);
        });
    }

    get value() {
        return this.#value;
    }

    get leftJoin() {
        return this.#leftJoin;
    }

    set leftJoin(leftJoin: Anchor) {
        this.#leftJoin = leftJoin;
    }

    get rightJoin() {
        return this.#rightJoin;
    }

    set rightJoin(rightJoin: Anchor) {
        this.#rightJoin = rightJoin;
    }

    get surroundNode() {
        return this.#surroundNode;
    }
}
