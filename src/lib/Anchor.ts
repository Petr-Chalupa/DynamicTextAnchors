import AnchorBlock from "./AnchorBlock";
import { getPathFromNode, invertHexColor, isValidHexColor } from "./utils";

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
    #currentKeys: string[] = [];

    constructor(anchorBlock: AnchorBlock, node: Node, startOffset: number, endOffset: number) {
        super();

        this.uuid = crypto.randomUUID();
        this.#startOffset = startOffset;
        this.#endOffset = endOffset;
        this.#anchorBlock = anchorBlock;
        this.#xPath = getPathFromNode(anchorBlock.dta.rootNode, node);
        this.#value = node.textContent.substring(startOffset, endOffset);

        const range = new Range();
        range.setStart(node, startOffset);
        range.setEnd(node, endOffset);
        range.surroundContents(this);
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

    set anchorBlock(anchorBlock: AnchorBlock) {
        this.#anchorBlock.destroyAnchors([this], false);
        this.#anchorBlock = anchorBlock;
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

    connectedCallback() {
        this.dataset.uuid = this.uuid;

        this.addEventListener("click", (e) => {
            this.dispatchEvent(new CustomEvent("anchor-click", { bubbles: true, detail: { originalEvent: e, anchor: this } }));
        });
        this.addEventListener("focusin", () => this.#anchorBlock.setFocused(true));
        this.addEventListener("focusout", () => this.#anchorBlock.setFocused(false));
        this.addEventListener("keyup", () => (this.#currentKeys = []));
        this.#setShortcut(["Control", "m", "l"], () => this.#anchorBlock.merge("left"));
        this.#setShortcut(["Control", "m", "r"], () => this.#anchorBlock.merge("right"));
        this.#setShortcut(["Control", "Alt", "Ł"], () => console.log("Edit left (to do)"));
        this.#setShortcut(["Control", "Alt", "r"], () => console.log("Edit right (to do)"));
        this.#setShortcut(["Control", "Delete"], () => this.#anchorBlock.dta.removeAnchorBlocks([this.anchorBlock]));
    }

    #setShortcut(shortcut: string[], handler: Function) {
        this.addEventListener("keydown", (e) => {
            if (!this.#currentKeys.includes(e.key)) this.#currentKeys.push(e.key);
            if (JSON.stringify(this.#currentKeys.sort()) == JSON.stringify(shortcut.sort())) {
                e.preventDefault();
                this.#currentKeys = [];
                handler();
            }
        });
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
