import { EventBus } from "../core/EventBus";
export class Renderer {
    root;
    renderedAnchors = new Map();
    interactive = true;
    eventBus = EventBus.getInstance();
    constructor(root) {
        this.root = root;
        this.eventBus.on("dta:deserialize", (event) => event.payload.anchors.forEach((a) => this.renderAnchor(a)), this);
        this.eventBus.on("anchor:create", (event) => this.renderAnchor(event.payload.anchor), this);
        this.eventBus.on("anchor:change", (event) => this.updateAnchor(event.payload.anchor), this);
        this.eventBus.on("anchor:destroy", (event) => this.removeAnchor(event.payload.anchor), this);
        this.eventBus.on("anchor:focus-request", (event) => this.focusAnchor(event.payload.anchor, event.payload.focus), this);
        this.eventBus.on("anchor:hover-request", (event) => this.hoverAnchor(event.payload.anchor, event.payload.hover), this);
    }
    updateAnchor(anchor) {
        this.removeAnchor(anchor);
        this.renderAnchor(anchor);
    }
    removeAnchor(anchor) {
        const nodes = this.renderedAnchors.get(anchor.id);
        if (!nodes)
            return;
        nodes.forEach((el) => el.destroy());
        this.renderedAnchors.delete(anchor.id);
    }
    focusAnchor(anchor, focus) {
        const nodes = this.renderedAnchors.get(anchor.id);
        if (!nodes)
            return;
        nodes.forEach((el) => el.toggleFocus(focus));
    }
    hoverAnchor(anchor, hover) {
        const nodes = this.renderedAnchors.get(anchor.id);
        if (!nodes)
            return;
        nodes.forEach((el) => el.toggleHover(hover));
    }
    destroy() {
        for (const nodes of this.renderedAnchors.values()) {
            nodes.forEach((el) => el.destroy());
        }
        this.renderedAnchors.clear();
        this.eventBus.emit({ type: "renderer:destroy", payload: { renderer: this } });
        this.eventBus.offAll(this);
    }
}
//# sourceMappingURL=Renderer.js.map