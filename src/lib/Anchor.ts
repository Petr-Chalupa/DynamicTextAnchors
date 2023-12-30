import AnchorBlock from "./AnchorBlock";
import { getPathFromEl } from "./utils";

export type SerializedAnchor = {
    startOffset: number;
    endOffset: number;
    xPath: string;
};

export default class Anchor extends HTMLElement {
    uuid: string;
    startOffset: number;
    endOffset: number;
    #anchorBlock: AnchorBlock;
    #xPath: string;
    #value: string;
    #leftJoin: Anchor = null;
    #rightJoin: Anchor = null;

    constructor(anchorBlock: AnchorBlock, node: Node, startOffset: number, endOffset: number) {
        super();

        this.uuid = crypto.randomUUID();
        this.startOffset = startOffset;
        this.endOffset = endOffset;
        this.#anchorBlock = anchorBlock;
        this.#xPath = getPathFromEl(anchorBlock.dta.rootNode, node);
        this.#value = node.textContent.substring(startOffset, endOffset);

        const range = new Range();
        range.setStart(node, this.startOffset);
        range.setEnd(node, this.endOffset);
        range.surroundContents(this);
    }

    connectedCallback() {
        this.dataset.uuid = this.uuid;
        this.tabIndex = -1;

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

    destroy() {
        const parentNode = this.parentNode;
        this.replaceWith(document.createTextNode(this.value));
        parentNode.normalize();
    }

    setChanged(changed: boolean) {
        if (changed) this.setAttribute("data-changed", "true");
        else this.removeAttribute("data-changed");
    }

    color(color: string) {
        this.style.backgroundColor = color;
        this.style.color = this.#invertColor(color);
    }

    #invertColor(hex: string) {
        if (hex.indexOf("#") === 0) hex = hex.slice(1);
        if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]; // convert 3-digit hex to 6-digits

        const r = parseInt(hex.slice(0, 2), 16),
            g = parseInt(hex.slice(2, 4), 16),
            b = parseInt(hex.slice(4, 6), 16);
        return r * 0.299 + g * 0.587 + b * 0.114 >= 185 ? "#000000" : "#FFFFFF";
    }

    serialize() {
        const serializedData: SerializedAnchor = {
            startOffset: this.startOffset,
            endOffset: this.endOffset,
            xPath: this.#xPath,
        };
        return serializedData;
    }
}
customElements.define("dta-anchor", Anchor);
