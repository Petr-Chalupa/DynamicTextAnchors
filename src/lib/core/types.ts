import { EventBusI } from "../events/types";
import { RendererI } from "../render/types";

export interface DTAI {
    readonly anchors: AnchorI[];
    readonly renderers: RendererI[];
    readonly eventBus: EventBusI;

    addRenderer(renderer: RendererI): void;
    removeRenderer(renderer: RendererI): void;
    createAnchorFromSelection(selection?: Selection | null): void;
    createAnchorFromRange(range: Range): void;
    removeAnchor(block: AnchorI): void;
    canAnchorMerge(anchor: AnchorI, direction: MergeDirection): boolean;
    mergeAnchor(anchor: AnchorI, direction: MergeDirection): void;
    serialize(): SerializedDTA;
    deserialize(data: SerializedDTA): void;
    clearAnchors(): void;
    clearRenderers(): void;
    destroy(): void;
}

export interface AnchorI {
    readonly id: string;
    readonly fgColor: ColorValue;
    readonly bgColor: ColorValue;
    readonly range: DTARange;
    readonly changed: boolean;
    readonly eventBus: EventBusI;

    setColor(bg: ColorValue, fg?: ColorValue): void;
    setRange(range: DTARange): void;
    acceptChange(): void;
    requestFocus(focus: boolean): void;
    requestMerge(direction: MergeDirection): void;
    serialize(): SerializedAnchor;
    destroy(): void;
}

export interface DTARange {
    start: number;
    end: number;
    quote: {
        exact: string;
        prefix?: string;
        suffix?: string;
        contextLen: number;
    };
}

export interface SerializedAnchor {
    id: string;
    bgColor: ColorValue;
    fgColor: ColorValue;
    range: DTARange;
    changed: boolean;
}

export interface SerializedDTA {
    anchors: SerializedAnchor[];
}

export type RangeIntersection = { type: "none" } | { type: "full:over" } | { type: "full:inner" } | { type: "partial"; trimmedExisting: DTARange };

export type Segment = { node: Text; start: number; end: number };

export type TextIndex = { text: string; segments: Segment[] };

export type MergeDirection = "left" | "right";

export type ColorValue = `#${string}`;
