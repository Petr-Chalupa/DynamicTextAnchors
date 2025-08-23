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
export interface AnchorElementI extends HTMLElement {
    anchor: AnchorI;
    eventBus: EventBusI;
    render(): void;
    requestFocus(focus: boolean): void;
    requestHover(hover: boolean): void;
    requestMerge(direction: MergeDirection): void;
    requestDestroy(): void;
    toggleFocus(focus: boolean): void;
    toggleHover(hover: boolean): void;
    destroy(): void;
}
export interface RendererI {
    readonly root: HTMLElement;
    readonly renderedAnchors: Map<string, AnchorElementI[]>;
    readonly interactive: boolean;
    readonly eventBus: EventBusI;
    renderAnchor(anchor: AnchorI): void;
    updateAnchor(anchor: AnchorI): void;
    removeAnchor(anchor: AnchorI): void;
    focusAnchor(anchor: AnchorI, focus: boolean): void;
    hoverAnchor(anchor: AnchorI, hover: boolean): void;
    destroy(): void;
}
export interface EventBusI {
    on<K extends keyof EventMap>(type: K, fn: (event: Event<K>) => void, target: any): void;
    off<K extends keyof EventMap>(type: K, fn: (event: Event<K>) => void, target: any): void;
    offAll(target: any): void;
    emit<K extends keyof EventMap>(event: Event<K>): void;
}
export interface EventMap {
    "anchor:create": {
        anchor: AnchorI;
    };
    "anchor:change": {
        anchor: AnchorI;
    };
    "anchor:merge": {
        anchor: AnchorI;
    };
    "anchor:destroy": {
        anchor: AnchorI;
    };
    "anchor:focus-request": {
        anchor: AnchorI;
        focus: boolean;
    };
    "anchor:hover-request": {
        anchor: AnchorI;
        hover: boolean;
    };
    "anchor:merge-request": {
        anchor: AnchorI;
        direction: MergeDirection;
    };
    "anchor:destroy-request": {
        anchor: AnchorI;
    };
    "renderer:render": {
        renderer: RendererI;
    };
    "renderer:destroy": {
        renderer: RendererI;
    };
    "dta:anchors-cleared": {};
    "dta:renderers-cleared": {};
    "dta:deserialize": {
        anchors: AnchorI[];
    };
    "dta:destroy": {};
}
export type Event<K extends keyof EventMap = keyof EventMap> = {
    type: K;
    payload: EventMap[K];
};
export type EventCallback<K extends keyof EventMap> = {
    fn: (event: Event<K>) => void;
    target: any;
};
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
export type RangeIntersection = {
    type: "none";
} | {
    type: "full:over";
} | {
    type: "full:inner";
} | {
    type: "partial";
    trimmedExisting: DTARange;
};
export type Segment = {
    node: Text;
    start: number;
    end: number;
};
export type TextIndex = {
    text: string;
    segments: Segment[];
};
export type MergeDirection = "left" | "right";
export type ColorValue = `#${string}`;
//# sourceMappingURL=types.d.ts.map