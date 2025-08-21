import { Anchor } from "..";
import { EventBus } from "../events/EventBus";
import { RendererI } from "../render/types";
import { generateRandomColor } from "../utils/color";
import { buildTextIndex, deserializeRange, findFirstTextNode, findLastTextNode, getSelection, mergeRange, rangeIntersects, serializeRange } from "../utils/dom";
import { AnchorI, DTAI, MergeDirection } from "./types";

export class DTA implements DTAI {
    anchors: AnchorI[] = [];
    renderers: RendererI[] = [];
    eventBus = EventBus.getInstance();

    constructor() {
        this.eventBus.on("anchor:destroy", (event) => this.removeAnchor(event.payload.anchor), this);
        this.eventBus.on("anchor:merge-request", (event) => this.mergeAnchor(event.payload.anchor, event.payload.direction), this);
        this.eventBus.on("renderer:destroy", (event) => this.removeRenderer(event.payload.renderer), this);
    }

    addRenderer(renderer: RendererI): void {
        if (!this.renderers.includes(renderer)) {
            this.renderers.push(renderer);
        }
    }

    removeRenderer(renderer: RendererI): void {
        this.renderers = this.renderers.filter((r) => r != renderer);
    }

    createAnchorFromSelection(selection?: Selection | null): void {
        if (!selection) selection = getSelection();
        if (!selection) return;

        for (let i = 0; i < selection.rangeCount; i++) {
            const range = selection.getRangeAt(i);
            this.createAnchorFromRange(range);
        }

        selection.collapseToEnd();
    }

    createAnchorFromRange(range: Range): void {
        const normalized = this.normalizeRange(range);
        if (!normalized) return;

        const { range: normRange, renderer } = normalized;
        const serNormRange = serializeRange(normRange, renderer.root);
        const { text: rootText } = buildTextIndex(renderer.root);

        for (const anchor of this.anchors) {
            const intersection = rangeIntersects(anchor.range, serNormRange, rootText);
            if (intersection.type === "full:over") {
                anchor.destroy();
            } else if (intersection.type === "full:inner") {
                return;
            } else if (intersection.type === "partial") {
                anchor.setRange(intersection.trimmedExisting);
            }
        }

        const newAnchor = new Anchor(serNormRange);
        this.anchors.push(newAnchor);
        this.eventBus.emit({ type: "anchor:create", payload: { anchor: newAnchor } });
    }

    removeAnchor(anchor: AnchorI): void {
        this.anchors = this.anchors.filter((a) => a != anchor);
    }

    mergeAnchor(anchor: AnchorI, direction: MergeDirection) {
        const mergeCandidate = this.anchors.find((a) => {
            if (direction === "left") return a.range.end === anchor.range.start;
            if (direction === "right") return a.range.start === anchor.range.end;
        });
        if (!mergeCandidate) return;

        const newRange = mergeRange(anchor.range, mergeCandidate.range, direction);
        mergeCandidate.destroy();
        anchor.setRange(newRange);
    }

    destroy(): void {
        for (let anchor of this.anchors) {
            anchor.destroy();
        }
        this.anchors = [];

        for (let renderer of this.renderers) {
            renderer.destroy();
        }
        this.renderers = [];

        this.eventBus.emit({ type: "dta:destroy", payload: {} });
        this.eventBus.offAll(this);
    }

    private normalizeRange(range: Range): { range: Range; renderer: RendererI } | null {
        for (const renderer of this.renderers) {
            if (!renderer.interactive) continue;

            const root = renderer.root;
            if (root.contains(range.startContainer) || root.contains(range.endContainer)) {
                const normalized = range.cloneRange();

                if (!root.contains(range.startContainer)) {
                    const firstNode = findFirstTextNode(root);
                    if (!firstNode) return null;
                    normalized.setStart(firstNode, 0);
                }
                if (!root.contains(range.endContainer)) {
                    const lastNode = findLastTextNode(root);
                    if (!lastNode) return null;
                    normalized.setEnd(lastNode, lastNode.textContent?.length ?? 0);
                }

                return normalized.collapsed ? null : { range: normalized, renderer };
            }
        }

        return null;
    }
}
