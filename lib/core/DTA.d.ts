import { DTAI, AnchorI, RendererI, MergeDirection, SerializedDTA } from "../types";
export declare class DTA implements DTAI {
    anchors: AnchorI[];
    renderers: RendererI[];
    eventBus: import("../types").EventBusI;
    constructor();
    addRenderer(renderer: RendererI): void;
    removeRenderer(renderer: RendererI): void;
    createAnchorFromSelection(selection?: Selection | null): void;
    createAnchorFromRange(range: Range): void;
    removeAnchor(anchor: AnchorI): void;
    canAnchorMerge(anchor: AnchorI, direction: MergeDirection): boolean;
    mergeAnchor(anchor: AnchorI, direction: MergeDirection): void;
    serialize(): SerializedDTA;
    deserialize(data: SerializedDTA): void;
    clearAnchors(): void;
    clearRenderers(): void;
    destroy(): void;
    private normalizeRange;
}
//# sourceMappingURL=DTA.d.ts.map