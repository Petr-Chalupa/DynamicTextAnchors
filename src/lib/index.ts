// interface WrapElement {
//     tag: string;
//     attributes: { [attr: string]: string };
// }

interface Props {
    color: string;
    data: object;
}

export class DTA {
    #rootNode: Element;
    // #xmlDoc: Document;
    // wrapElement: WrapElement = { tag: "mark", attributes: {} };
    anchorBlocks: AnchorBlock[] = [];

    constructor() {}

    get rootNode() {
        return this.#rootNode;
    }

    set rootNode(rootNode: Element) {
        this.#rootNode = rootNode;
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
            if (!(container.isSameNode(this.#rootNode) || this.#rootNode.contains(container))) throw new Error(`Anchor creation error: Invalid selection at range ${i}!`);

            const anchorBlock = new AnchorBlock(container, range);
            this.anchorBlocks.push(anchorBlock);
        }
    }

    serialize() {
        return {
            rootNode: this.#rootNode,
            anchorBlocks: this.anchorBlocks.map((anchorBlock) => anchorBlock.serialize()),
        };
    }

    deserialize(data: { rootNode: Element; anchorBlocks: { anchors: { node: Node; startOffset: number; endOffset: number; uuid: string }[]; value: string; props: Props; container: Node }[] }) {
        this.#rootNode = data.rootNode;
        this.anchorBlocks = data.anchorBlocks.map((anchorBlockData) => {
            const anchorBlock = new AnchorBlock(anchorBlockData.container);
            anchorBlock.deserialize(anchorBlockData);
            return anchorBlock;
        });
    }
}

class AnchorBlock {
    anchors: Anchor[] = [];
    #value: string = "";
    props: Props = { color: "#ffff00", data: {} };
    #container: Node;

    constructor(container: Node, range?: Range) {
        this.#container = container; // set to position not Node

        if (range) {
            const intersectingTextNodes: Node[] = [];
            (function traverse(node: Node) {
                if (!range.intersectsNode(node)) return;
                if (node.nodeType === Node.ELEMENT_NODE) {
                    for (const child of node.childNodes) traverse(child);
                } else if (node.nodeType === Node.TEXT_NODE) {
                    intersectingTextNodes.push(node);
                }
            })(container);

            intersectingTextNodes.forEach((node, index) => {
                const startOffset = index === 0 ? range.startOffset : 0;
                const endOffset = index === intersectingTextNodes.length - 1 ? range.endOffset : node.textContent.length;

                const anchor = new Anchor(node, startOffset, endOffset);
                if (index > 0) {
                    anchor.leftJoin = this.anchors[index - 1];
                    this.anchors[index - 1].rightJoin = anchor;
                }
                this.anchors.push(anchor);
                this.#value += anchor.value;
            });

            range.collapse();
        }
    }

    get value() {
        return this.#value;
    }

    serialize() {
        return {
            anchors: this.anchors.map((anchor) => anchor.serialize()),
            value: this.#value,
            props: this.props,
            conainer: this.#container,
        };
    }

    deserialize(data: { anchors: { node: Node; startOffset: number; endOffset: number; uuid: string }[]; value: string; props: Props; container: Node }) {
        this.anchors = data.anchors.map((anchorData, index) => {
            const anchor = new Anchor(anchorData.node, anchorData.startOffset, anchorData.endOffset, anchorData.uuid);
            // anchor.deserialize(anchorData);
            if (index > 0) {
                anchor.leftJoin = this.anchors[index - 1];
                this.anchors[index - 1].rightJoin = anchor;
            }
            return anchor;
        });
        this.#value = data.value;
        this.props = data.props;
        this.#container = data.container;
    }
}

class Anchor extends HTMLElement {
    uuid: string;
    #value: string;
    startOffset: number;
    endOffset: number;
    #leftJoin: Anchor = null;
    #rightJoin: Anchor = null;
    #node: Node;
    // #surroundNode: Element;

    constructor(node: Node, startOffset: number, endOffset: number, uuid?: string) {
        super();

        this.uuid = uuid ?? crypto.randomUUID();
        this.#value = node.textContent.substring(startOffset, endOffset);
        this.startOffset = startOffset;
        this.endOffset = endOffset;
        this.#node = node; //set to position not Node

        this.dataset.uuid = this.uuid;
        this.tabIndex = 0;

        const partialRange = new Range();
        partialRange.setStart(node, this.startOffset);
        partialRange.setEnd(node, this.endOffset);
        partialRange.surroundContents(this);

        this.addEventListener("click", (e) => {
            const anchorCustomEvent = new CustomEvent("anchor-click", { bubbles: true, detail: { originalEvent: e, anchor: this } });
            this.dispatchEvent(anchorCustomEvent);
        });

        // this.uuid = crypto.randomUUID();
        // this.#value = node.textContent.substring(startOffset, endOffset);
        // this.startOffset = startOffset;
        // this.endOffset = endOffset;

        // this.#surroundNode = document.createElement(wrapElement.tag);
        // this.#surroundNode.setAttribute("data-uuid", this.uuid);
        // this.#surroundNode.setAttribute("tabindex", "0");
        // for (const [attr, value] of Object.entries(wrapElement.attributes)) this.#surroundNode.setAttribute(attr, value);

        // const partialRange = new Range();
        // partialRange.setStart(node, this.startOffset);
        // partialRange.setEnd(node, this.endOffset);
        // partialRange.surroundContents(this.#surroundNode);

        // this.#surroundNode.addEventListener("click", (e) => {
        //     const anchorCustomEvent = new CustomEvent("anchor-click", { bubbles: true, detail: { originalEvent: e, anchor: this } });
        //     this.#surroundNode.dispatchEvent(anchorCustomEvent);
        // });
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

    // get surroundNode() {
    //     return this.#surroundNode;
    // }

    serialize() {
        return {
            uuid: this.uuid,
            value: this.#value,
            startOffset: this.startOffset,
            endOffset: this.endOffset,
            leftJoin: this.#leftJoin?.uuid,
            rightJoin: this.#rightJoin?.uuid,
            node: this.#node,
        };
    }

    // deserialize(data: object) {}
}
customElements.define("dta-anchor", Anchor);
