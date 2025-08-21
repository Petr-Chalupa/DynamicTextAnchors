import { EventBusI } from "../events/types";
import { RendererI } from "../render/types";

export interface DTAI {
    readonly anchors: AnchorI[];
    readonly renderers: RendererI[];
    readonly eventBus: EventBusI;

    addRenderer(renderer: RendererI): void;
    removeRenderer(renderer: RendererI): void;
    createAnchorFromSelection(selection?: Selection | null): void;
    removeAnchor(block: AnchorI): void;
    destroy(): void;
}

export interface AnchorI {
    id: string;
    fgColor: ColorValue;
    bgColor: ColorValue;
    range: DTARange;
    readonly eventBus: EventBusI;

    setColor(bg: ColorValue, fg?: ColorValue): void;
    setRange(range: DTARange): void;
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

export type RangeIntersection = { type: "none" } | { type: "full:over" } | { type: "full:inner" } | { type: "partial"; trimmedExisting: DTARange };

export type Segment = { node: Text; start: number; end: number };

export type TextIndex = { text: string; segments: Segment[] };

export type MergeDirection = "left" | "right";

export type ColorValue = `#${string}`;
