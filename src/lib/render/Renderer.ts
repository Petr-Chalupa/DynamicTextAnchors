import { AnchorI, RendererI, AnchorElementI } from "../types";
import { EventBus } from "../core/EventBus";

export abstract class Renderer implements RendererI {
    root: HTMLElement;
    renderedAnchors = new Map<string, AnchorElementI[]>();
    interactive = true;
    eventBus = EventBus.getInstance();

    constructor(root: HTMLElement) {
        this.root = root;
        this.eventBus.on("dta:deserialize", (event) => event.payload.anchors.forEach((a) => this.renderAnchor(a)), this);
        this.eventBus.on("anchor:create", (event) => this.renderAnchor(event.payload.anchor), this);
        this.eventBus.on("anchor:change", (event) => this.updateAnchor(event.payload.anchor), this);
        this.eventBus.on("anchor:destroy", (event) => this.removeAnchor(event.payload.anchor), this);
        this.eventBus.on("anchor:focus-request", (event) => this.focusAnchor(event.payload.anchor, event.payload.focus), this);
        this.eventBus.on("anchor:hover-request", (event) => this.hoverAnchor(event.payload.anchor, event.payload.hover), this);
    }

    abstract renderAnchor(anchor: AnchorI): void;

    updateAnchor(anchor: AnchorI): void {
        this.removeAnchor(anchor);
        this.renderAnchor(anchor);
    }

    removeAnchor(anchor: AnchorI): void {
        const nodes = this.renderedAnchors.get(anchor.id);
        if (!nodes) return;

        nodes.forEach((el) => el.destroy());
        this.renderedAnchors.delete(anchor.id);
    }

    focusAnchor(anchor: AnchorI, focus: boolean): void {
        const nodes = this.renderedAnchors.get(anchor.id);
        if (!nodes) return;

        nodes.forEach((el) => el.toggleFocus(focus));
    }

    hoverAnchor(anchor: AnchorI, hover: boolean): void {
        const nodes = this.renderedAnchors.get(anchor.id);
        if (!nodes) return;

        nodes.forEach((el) => el.toggleHover(hover));
    }

    destroy(): void {
        for (const nodes of this.renderedAnchors.values()) {
            nodes.forEach((el) => el.destroy());
        }
        this.renderedAnchors.clear();
        this.eventBus.emit({ type: "renderer:destroy", payload: { renderer: this } });
        this.eventBus.offAll(this);
    }
}
