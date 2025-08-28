import { TextIndex, DTARange, RangeIntersection, MergeDirection } from "../types";
export declare function getSelection(): Selection | null;
export declare function buildTextIndex(root: Node): TextIndex;
export declare function serializeRange(range: Range, root: Element, contextLen?: number): {
    start: number;
    end: number;
    quote: {
        exact: string;
        prefix: string;
        suffix: string;
        contextLen: number;
    };
};
export declare function deserializeRange(range: DTARange, root: Element): Range | null;
export declare function rangeIntersects(existing: DTARange, incoming: DTARange, fullText: string): RangeIntersection;
export declare function mergeRange(survivor: DTARange, other: DTARange, direction: MergeDirection): DTARange;
export declare function findFirstTextNode(root: Node): Text | null;
export declare function findLastTextNode(root: Node): Text | null;
export declare function getAllTextNodes(range: Range): Text[];
//# sourceMappingURL=dom.d.ts.map