import AnchorBlock from "./AnchorBlock";
import { getPathFromEl, invertHexColor, isValidHexColor } from "./utils";

export type SerializedAnchor = {
    startOffset: number;
    endOffset: number;
    xPath: string;
};

export default class Anchor extends HTMLElement {
    uuid: string;
    #startOffset: number;
    #endOffset: number;
    #anchorBlock: AnchorBlock;
    #xPath: string;
    #value: string;
    #leftJoin: Anchor = null;
    #rightJoin: Anchor = null;

    constructor(anchorBlock: AnchorBlock, node: Node, startOffset: number, endOffset: number) {
        super();

        this.uuid = crypto.randomUUID();
        this.#startOffset = startOffset;
        this.#endOffset = endOffset;
        this.#anchorBlock = anchorBlock;
        this.#xPath = getPathFromEl(anchorBlock.dta.rootNode, node);
        this.#value = node.textContent.substring(startOffset, endOffset);

        const range = new Range();
        range.setStart(node, startOffset);
        range.setEnd(node, endOffset);
        range.surroundContents(this);
    }

    connectedCallback() {
        this.dataset.uuid = this.uuid;
        this.tabIndex = -1;

        this.addEventListener("click", (e) => {
            const anchorCustomEvent = new CustomEvent("anchor-click", { bubbles: true, detail: { originalEvent: e, anchor: this } });
            this.dispatchEvent(anchorCustomEvent);
        });
        this.addEventListener("focusin", () => this.#anchorBlock.setFocused(true));
        this.addEventListener("focusout", () => this.#anchorBlock.setFocused(false));
    }

    get startOffset() {
        return this.#startOffset;
    }

    get endOffset() {
        return this.#endOffset;
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

    setFocused(focused: boolean) {
        if (focused) this.setAttribute("data-focused", "true");
        else this.removeAttribute("data-focused");
    }

    color(color: string) {
        if (!isValidHexColor(color)) return;
        this.style.backgroundColor = color;
        this.style.color = invertHexColor(color);
    }

    serialize() {
        const serializedData: SerializedAnchor = {
            startOffset: this.#startOffset,
            endOffset: this.#endOffset,
            xPath: this.#xPath,
        };
        return serializedData;
    }
}
customElements.define("dta-anchor", Anchor);
