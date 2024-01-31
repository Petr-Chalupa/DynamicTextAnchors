import AnchorBlock from "./AnchorBlock";
import { getPathFromNode, invertHexColor, isValidHexColor } from "./utils";

export type SerializedAnchor = {
    startOffset: number;
    endOffset: number;
    xPath: string;
    value: string;
};

export default class Anchor extends HTMLElement {
    uuid: string;
    leftJoin: Anchor = null;
    rightJoin: Anchor = null;
    #anchorBlock: AnchorBlock;
    #currentKeys: string[] = [];

    constructor(anchorBlock: AnchorBlock) {
        super();

        this.uuid = crypto.randomUUID();
        this.#anchorBlock = anchorBlock;
    }

    get anchorBlock() {
        return this.#anchorBlock;
    }

    set anchorBlock(anchorBlock: AnchorBlock) {
        this.#anchorBlock.removeAnchors([this], false);
        this.#anchorBlock = anchorBlock;
    }

    get startOffset() {
        return this.previousSibling?.nodeType === Node.TEXT_NODE ? this.previousSibling.textContent.length : 0;
    }

    get endOffset() {
        return this.startOffset + this.value.length;
    }

    get value() {
        return this.textContent;
    }

    get xPath() {
        let nodePosition = 0;
        let prevSibling = this.previousSibling;
        while (prevSibling != null) {
            if (prevSibling.nodeType === prevSibling.TEXT_NODE) nodePosition++;
            else if (/^DTA-ANCHOR$/i.test(prevSibling.nodeName)) nodePosition--;
            prevSibling = prevSibling.previousSibling;
        }
        return getPathFromNode(this.#anchorBlock.dta.rootNode, this.parentNode) + `/text()[${nodePosition}]`;
    }

    connectedCallback() {
        this.dataset.uuid = this.uuid;

        // focus handling
        this.addEventListener("focusin", () => this.#anchorBlock.setFocused(true));
        this.addEventListener("focusout", () => this.#anchorBlock.setFocused(false));

        // keyboard shortcuts
        this.addEventListener("keyup", () => (this.#currentKeys = []));
        this.#setShortcut(["Control", "m", "l"], () => this.#anchorBlock.merge("left"));
        this.#setShortcut(["Control", "m", "r"], () => this.#anchorBlock.merge("right"));
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
        if (focused) {
            this.setAttribute("data-focused", "true");
            if (this.tabIndex === 0 && document.activeElement != this) this.focus(); // ensure the first Anchor is focused
        } else this.removeAttribute("data-focused");
    }

    color(color: string) {
        if (!isValidHexColor(color)) return;
        this.style.backgroundColor = color;
        this.style.color = invertHexColor(color);
    }

    serialize() {
        const serializedData: SerializedAnchor = {
            startOffset: this.startOffset,
            endOffset: this.endOffset,
            xPath: this.xPath,
            value: this.value,
        };
        return serializedData;
    }
}
customElements.define("dta-anchor", Anchor);
