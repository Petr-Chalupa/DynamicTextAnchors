import { getElFromPath, getPathFromEl } from "./utils";

export interface SerializedAnchor {
    uuid: string;
    value: string;
    startOffset: number;
    endOffset: number;
    leftJoin: string;
    rightJoin: string;
    xPath: string;
}

export default class Anchor extends HTMLElement {
    rootNode: Element;
    uuid: string;
    #value: string;
    startOffset: number;
    endOffset: number;
    #leftJoin: Anchor = null;
    #rightJoin: Anchor = null;
    #xPath: string;

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

        this.#value = node.textContent.substring(startOffset, endOffset);
        this.#xPath = getPathFromEl(rootNode, node);

        const partialRange = new Range();
        partialRange.setStart(node, this.startOffset);
        partialRange.setEnd(node, this.endOffset);
        partialRange.surroundContents(this);
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

    color(color: string) {
        this.style.backgroundColor = color;
    }

    serialize() {
        const serializedData: SerializedAnchor = {
            uuid: this.uuid,
            value: this.#value,
            startOffset: this.startOffset,
            endOffset: this.endOffset,
            leftJoin: this.#leftJoin?.uuid,
            rightJoin: this.#rightJoin?.uuid,
            xPath: this.#xPath,
        };
        return serializedData;
    }

    deserialize(data: SerializedAnchor) {
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
