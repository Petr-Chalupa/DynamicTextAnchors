import { AnchorInline } from "../elem/AnchorInline";
import { EventBus } from "../core/EventBus";
import { RendererI, AnchorInlineI, AnchorI } from "../types";
import { deserializeRange, getAllTextNodes } from "../utils/dom";

export class InlineRenderer implements RendererI {
    root: HTMLElement;
    renderedAnchors = new Map<string, AnchorInlineI[]>();
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

    renderAnchor(anchor: AnchorI): void {
        const srcRange = deserializeRange(anchor.range, this.root);
        if (!srcRange) return;

        const textNodes = getAllTextNodes(srcRange);
        if (textNodes.length === 0) return;

        const nodes: AnchorInline[] = [];
        const { startOffset, endOffset } = srcRange;

        textNodes.forEach((textNode, i) => {
            const parent = textNode.parentNode;
            if (!parent) return;

            const isFirst = i === 0;
            const isLast = i === textNodes.length - 1;
            const textLength = textNode.textContent?.length ?? 0;

            const start = isFirst ? startOffset : 0;
            const end = isLast ? endOffset : textLength;

            const beforeText = textNode.textContent?.slice(0, start) ?? "";
            const middleText = textNode.textContent?.slice(start, end) ?? "";
            const afterText = textNode.textContent?.slice(end) ?? "";

            const fragment = document.createDocumentFragment();
            if (beforeText) {
                fragment.appendChild(document.createTextNode(beforeText));
            }
            if (middleText) {
                const wrapper = new AnchorInline(anchor);
                wrapper.appendChild(document.createTextNode(middleText));
                fragment.appendChild(wrapper);
                nodes.push(wrapper);
            }
            if (afterText) {
                fragment.appendChild(document.createTextNode(afterText));
            }
            parent.insertBefore(fragment, textNode);
            parent.removeChild(textNode);
        });

        if (nodes.length > 0) this.renderedAnchors.set(anchor.id, nodes);
    }

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
