import AnchorBlock from "./AnchorBlock";
import { getPathFromEl } from "./utils";

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
    #anchorBlock: AnchorBlock;
    uuid: string;
    #value: string;
    startOffset: number;
    endOffset: number;
    #leftJoin: Anchor = null;
    #rightJoin: Anchor = null;
    #xPath: string;

    constructor(anchorBlock: AnchorBlock, node: Node, startOffset: number, endOffset: number, uuid?: string, xPath?: string) {
        super();

        uuid ??= crypto.randomUUID();
        xPath ??= getPathFromEl(anchorBlock.rootNode, node);

        this.#anchorBlock = anchorBlock;
        this.uuid = uuid;
        this.#value = node.textContent.substring(startOffset, endOffset);
        this.startOffset = startOffset;
        this.endOffset = endOffset;
        this.#xPath = xPath;

        const partialRange = new Range();
        partialRange.setStart(node, this.startOffset);
        partialRange.setEnd(node, this.endOffset);
        partialRange.surroundContents(this);
    }

    connectedCallback() {
        this.dataset.uuid = this.uuid;
        this.tabIndex = -1;
        this.setAttribute("aria-label", "Anchor");

        this.addEventListener("click", (e) => {
            const anchorCustomEvent = new CustomEvent("anchor-click", { bubbles: true, detail: { originalEvent: e, anchor: this } });
            this.dispatchEvent(anchorCustomEvent);
        });
    }

    get anchorBlock() {
        return this.#anchorBlock;
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
        this.style.color = this.#invertColor(color);
    }

    #invertColor(hex: string) {
        if (hex.indexOf("#") === 0) hex = hex.slice(1);
        if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]; // convert 3-digit hex to 6-digits
        if (hex.length !== 6) throw new Error("Invalid HEX color!");

        const r = parseInt(hex.slice(0, 2), 16),
            g = parseInt(hex.slice(2, 4), 16),
            b = parseInt(hex.slice(4, 6), 16);
        return r * 0.299 + g * 0.587 + b * 0.114 >= 185 ? "#000000" : "#FFFFFF";
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
}
customElements.define("dta-anchor", Anchor);
