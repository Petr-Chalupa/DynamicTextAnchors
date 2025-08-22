import { EventBus } from "../core/EventBus";
import { AnchorI, MergeDirection, AnchorElementI } from "../types";

export abstract class AnchorElement extends HTMLElement implements AnchorElementI {
    anchor: AnchorI;
    eventBus = EventBus.getInstance();

    constructor(anchor: AnchorI) {
        super();
        this.anchor = anchor;
    }

    connectedCallback(): void {
        this.addEventListener("focusin", () => this.requestFocus(true));
        this.addEventListener("focusout", () => this.requestFocus(false));
        this.addEventListener("mouseenter", () => this.requestHover(true));
        this.addEventListener("mouseleave", () => this.requestHover(false));
        this.render();
    }

    abstract render(): void;

    requestFocus(focus: boolean): void {
        this.eventBus.emit({ type: "anchor:focus-request", payload: { anchor: this.anchor, focus } });
    }

    requestHover(hover: boolean): void {
        this.eventBus.emit({ type: "anchor:hover-request", payload: { anchor: this.anchor, hover } });
    }

    requestMerge(direction: MergeDirection): void {
        this.eventBus.emit({ type: "anchor:merge-request", payload: { anchor: this.anchor, direction } });
    }

    requestDestroy(): void {
        this.eventBus.emit({ type: "anchor:destroy-request", payload: { anchor: this.anchor } });
    }

    abstract toggleFocus(focus: boolean): void;

    abstract toggleHover(hover: boolean): void;

    abstract destroy(): void;
}
