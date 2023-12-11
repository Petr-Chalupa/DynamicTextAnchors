import { getElFromPath, getPathFromEl } from "./utils";

export default class Anchor extends HTMLElement {
    rootNode: Element;
    uuid: string;
    #value: string;
    startOffset: number;
    endOffset: number;
    #leftJoin: Anchor = null;
    #rightJoin: Anchor = null;
    // #node: Node;
    #xPath: string;
    // #surroundNode: Element;

    constructor(rootNode: Element, node: Node, startOffset: number, endOffset: number, uuid?: string) {
        super();

        this.rootNode = rootNode;
        this.uuid = uuid ?? crypto.randomUUID();
        this.startOffset = startOffset;
        this.endOffset = endOffset;

        this.dataset.uuid = this.uuid;
        this.tabIndex = 0;

        this.addEventListener("click", (e) => {
            const anchorCustomEvent = new CustomEvent("anchor-click", { bubbles: true, detail: { originalEvent: e, anchor: this } });
            this.dispatchEvent(anchorCustomEvent);
        });

        if (!node) return;
        // this.#node = node; //set to position not Node
        this.#value = node.textContent.substring(startOffset, endOffset);
        this.#xPath = getPathFromEl(rootNode, node);

        const partialRange = new Range();
        partialRange.setStart(node, this.startOffset);
        partialRange.setEnd(node, this.endOffset);
        partialRange.surroundContents(this);

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
            // node: this.#node,
            xPath: this.#xPath,
        };
    }

    deserialize(data: { startOffset: number; endOffset: number; uuid: string; xPath: string }) {
        const node = getElFromPath(this.rootNode, data.xPath);
        console.log(node);

        this.#xPath = data.xPath;
        this.#value = node.textContent.substring(this.startOffset, this.endOffset);

        const partialRange = new Range();
        partialRange.setStart(node, this.startOffset);
        partialRange.setEnd(node, this.endOffset);
        partialRange.surroundContents(this);
    }
}
customElements.define("dta-anchor", Anchor);
