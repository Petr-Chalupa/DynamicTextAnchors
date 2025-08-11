// =============================================================================
// CONFIGURATION AND SETTINGS TYPES
// =============================================================================

export const DTA_CONSTANTS = {
    ELEMENT_TAG_NAME: "DTA-ANCHOR",
    DEFAULT_COLOR: "#fff000" as const,
    KEYBOARD_SHORTCUTS: {
        MERGE_LEFT: ["ArrowLeft", "Meta"] as const,
        MERGE_RIGHT: ["ArrowRight", "Meta"] as const,
        DELETE: ["Backspace"] as const,
    } as const,
    VALIDATION: {
        MIN_OFFSET: 0,
        MAX_XPATH_LENGTH: 1000,
        MAX_VALUE_LENGTH: 500,
    } as const,
} as const;

export type AnchorBlockData = Record<string, unknown>;

export type MergeDirection = "left" | "right";

export type ColorValue = `#${string}`;

export interface DTAConfig {
    readonly rootNode: Element;
    readonly enableKeyboardShortcuts?: boolean;
    readonly defaultColor?: ColorValue;
    readonly autoFocus?: boolean;
    readonly maxXPathLength?: number;
    readonly maxValueLength?: number;
}

// =============================================================================
// CLASS INTERFACE TYPES
// =============================================================================

export interface AnchorInstance extends HTMLElement {
    readonly uuid: string;
    readonly startOffset: number;
    readonly endOffset: number;
    readonly value: string;
    readonly xPath: string;
    anchorBlock: AnchorBlockInstance;
    leftJoin: AnchorInstance | null;
    rightJoin: AnchorInstance | null;

    destroy(): void;
    setChanged(changed: boolean): void;
    setFocused(focused: boolean): void;
    color(color: ColorValue): void;
    serialize(): SerializedAnchor;
    destroy(): void;
}

export interface AnchorBlockInstance {
    readonly uuid: string;
    readonly value: string;
    readonly anchors: readonly AnchorInstance[];
    readonly dta: DTAInstance;
    color: ColorValue;
    data: AnchorBlockData;

    createAnchor(node: Node, startOffset: number, endOffset: number): AnchorInstance | null;
    joinAnchors(): void;
    removeAnchors(anchors?: readonly AnchorInstance[], destroy?: boolean | "remove"): void;
    setFocused(focused: boolean, anchors?: readonly AnchorInstance[]): void;
    canMerge(to: MergeDirection): AnchorBlockInstance | null;
    merge(to: MergeDirection): void;
    serialize(): SerializedAnchorBlock;
    destroy(): void;
}

export interface DTAInstance {
    readonly config: Readonly<DTAConfig>;
    readonly anchorBlocks: readonly AnchorBlockInstance[];

    get rootNode(): Element;

    createAnchorBlockFromSelection(): AnchorBlockInstance | null;
    removeAnchorBlocks(anchorBlocks?: readonly AnchorBlockInstance[], destroy?: boolean | "remove"): void;
    getTextNodeContainer(node: Node): AnchorBlockInstance | null;
    sort(): void;
    serialize(): SerializedDTA;
    deserialize(data: SerializedDTA): void;
    createError(type: DTAErrorType, message: string, context?: any): DTAError;
}

// =============================================================================
// SERIALIZED ENTITY TYPES
// =============================================================================

export interface SerializedAnchor {
    readonly startOffset: number;
    readonly endOffset: number;
    readonly xPath: string;
    readonly value: string;
}

export interface SerializedAnchorBlock {
    readonly value: string;
    readonly color: ColorValue;
    readonly data: AnchorBlockData;
    readonly anchors: readonly SerializedAnchor[];
}

export interface SerializedDTA {
    readonly anchorBlocks: readonly SerializedAnchorBlock[];
    readonly version?: string;
    readonly metadata?: {
        readonly created?: string;
        readonly modified?: string;
        readonly anchorBlockCount?: number;
        readonly totalAnchors?: number;
        readonly [key: string]: unknown;
    };
}

// =============================================================================
// EVENT AND INTERACTION TYPES
// =============================================================================

export interface DTAEvents {
    "anchor:focus": { anchorId: string; blockId: string; anchor: AnchorInstance };
    "anchor:blur": { anchorId: string; blockId: string; anchor: AnchorInstance };
    "anchor:create": { anchorId: string; blockId: string; anchor: AnchorInstance };
    "anchor:destroy": { anchorId: string; blockId: string; anchor: AnchorInstance };
    "anchor:change": { anchorId: string; blockId: string; anchor: AnchorInstance };
    "block:create": { blockId: string; block: AnchorBlockInstance };
    "block:destroy": { blockId: string; block: AnchorBlockInstance };
    "block:merge": { fromBlockId: string; toBlockId: string; fromBlock: AnchorBlockInstance; toBlock: AnchorBlockInstance };
    "selection:create": { selection: Selection; anchorBlocks: AnchorBlockInstance[] };
    error: { error: DTAError };
}

export interface AnchorKeyboardShortcut {
    readonly keys: readonly string[];
    readonly handler: () => void;
    readonly description?: string;
    readonly enabled?: boolean;
}

export interface DTAEventHandlers {
    readonly onAnchorFocus?: (anchor: AnchorInstance) => void;
    readonly onAnchorBlur?: (anchor: AnchorInstance) => void;
    readonly onAnchorChange?: (anchor: AnchorInstance) => void;
    readonly onAnchorCreate?: (anchor: AnchorInstance) => void;
    readonly onAnchorDestroy?: (anchor: AnchorInstance) => void;
    readonly onAnchorBlockCreate?: (anchorBlock: AnchorBlockInstance) => void;
    readonly onAnchorBlockRemove?: (anchorBlock: AnchorBlockInstance) => void;
    readonly onAnchorBlockMerge?: (fromBlock: AnchorBlockInstance, toBlock: AnchorBlockInstance) => void;
    readonly onError?: (error: DTAError) => void;
}

// =============================================================================
// DOM AND SELECTION TYPES
// =============================================================================

export interface SelectionRange {
    readonly startNode: Node;
    readonly startOffset: number;
    readonly endNode: Node;
    readonly endOffset: number;
    readonly text: string;
    readonly collapsed?: boolean;
}

export interface ConnectingTextNodes {
    readonly left: Node | null;
    readonly right: Node | null;
}

export interface NodePosition {
    readonly node: Node;
    readonly offset: number;
}

// =============================================================================
// ERROR TYPES
// =============================================================================

export type DTAErrorType = "SELECTION_ERROR" | "ANCHOR_CREATION_ERROR" | "SERIALIZATION_ERROR" | "DESERIALIZATION_ERROR" | "VALIDATION_ERROR" | "DOM_MANIPULATION_ERROR" | "CONFIGURATION_ERROR";

export interface DTAError extends Error {
    readonly type: DTAErrorType;
    readonly code?: string;
    readonly context?: Record<string, unknown>;
    readonly timestamp: Date;
}
