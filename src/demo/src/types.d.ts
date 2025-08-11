// =============================================================================
// VUE FILE IMPORT MODULES
// =============================================================================

declare module "*.svg?url" {
    const content: string;
    export default content;
}

declare module "*.wav?url" {
    const content: string;
    export default content;
}

declare module "*.mp4?url" {
    const content: string;
    export default content;
}

// =============================================================================
// LOREM GENERATOR TYPES
// =============================================================================

export interface RangeSettings {
    readonly max: number;
    readonly min: number;
}

export interface AdditionalTags {
    readonly text: readonly string[];
    readonly special: readonly string[];
}

export interface LoremSettings {
    readonly sentencesPerParagraph: RangeSettings;
    readonly wordsPerSentence: RangeSettings;
    readonly maxDepth: number;
    readonly additionalTags: AdditionalTags;
    readonly seedValue?: number;
}

export type TagType = "img" | "audio" | "video" | "table" | "div" | "span" | "p" | string;

export interface LoremGeneratorEmits {
    "gen-xml": [xml: string];
    progress: [progress: number];
    complete: [result: string];
}
