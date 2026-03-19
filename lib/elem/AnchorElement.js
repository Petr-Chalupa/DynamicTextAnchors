import { EventBus } from "../core/EventBus";
export class AnchorElement extends HTMLElement {
    anchor;
    eventBus = EventBus.getInstance();
    constructor(anchor) {
        super();
        this.anchor = anchor;
    }
    connectedCallback() {
        this.addEventListener("focusin", () => this.requestFocus(true));
        this.addEventListener("focusout", () => this.requestFocus(false));
        this.addEventListener("mouseenter", () => this.requestHover(true));
        this.addEventListener("mouseleave", () => this.requestHover(false));
        this.render();
    }
    render() {
        this.dataset.id = this.anchor.id;
        if (this.anchor.changed)
            this.setAttribute("data-changed", "");
        else
            this.removeAttribute("data-changed");
    }
    requestFocus(focus) {
        this.eventBus.emit({ type: "anchor:focus-request", payload: { anchor: this.anchor, focus } });
    }
    requestHover(hover) {
        this.eventBus.emit({ type: "anchor:hover-request", payload: { anchor: this.anchor, hover } });
    }
    requestMerge(direction) {
        this.eventBus.emit({ type: "anchor:merge-request", payload: { anchor: this.anchor, direction } });
    }
    requestDestroy() {
        this.eventBus.emit({ type: "anchor:destroy-request", payload: { anchor: this.anchor } });
    }
}
//# sourceMappingURL=AnchorElement.js.map