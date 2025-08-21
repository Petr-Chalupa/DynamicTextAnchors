import { AnchorI, MergeDirection } from "../core/types";
import { EventBus } from "../events/EventBus";
import { adjustColorBrightness } from "../utils/color";

export class AnchorInline extends HTMLElement {
    anchor: AnchorI;
    eventBus = EventBus.getInstance();

    constructor(anchor: AnchorI) {
        super();
        this.anchor = anchor;
    }

    connectedCallback() {
        this.addEventListener("focusin", () => this.requestFocus(true));
        this.addEventListener("focusout", () => this.requestFocus(false));
        //
        this.addEventListener("mouseenter", () => this.requestHover(true));
        this.addEventListener("mouseleave", () => this.requestHover(false));

        this.render();
    }

    render() {
        this.setAttribute("tabindex", "0");
        this.dataset.id = this.anchor.id;
        this.style.color = this.anchor.fgColor;
        this.style.backgroundColor = this.anchor.bgColor;
    }

    requestFocus(focus: boolean) {
        this.eventBus.emit({ type: "anchor:focus-request", payload: { anchor: this.anchor, focus } });
    }

    requestHover(hover: boolean) {
        this.eventBus.emit({ type: "anchor:hover-request", payload: { anchor: this.anchor, hover } });
    }

    requestMerge(direction: MergeDirection) {
        this.eventBus.emit({ type: "anchor:merge-request", payload: { anchor: this.anchor, direction } });
    }

    requestDestroy() {
        this.eventBus.emit({ type: "anchor:destroy-request", payload: { anchor: this.anchor } });
    }

    toggleFocus(focus: boolean) {
        if (focus) this.setAttribute("data-focused", "");
        else this.removeAttribute("data-focused");
    }

    toggleHover(hover: boolean) {
        if (hover) this.style.backgroundColor = adjustColorBrightness(this.anchor.bgColor, -10);
        else this.style.backgroundColor = this.anchor.bgColor;
    }

    destroy() {
        const parentNode = this.parentNode;
        if (parentNode) {
            this.replaceWith(document.createTextNode(this.textContent));
            parentNode.normalize();
        }
    }
}

customElements.define("dta-anchor", AnchorInline);
