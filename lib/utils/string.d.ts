export declare function normalizeString(str: string): string;
export declare function escapeRegExp(str: string): string;
export declare function calculateStringSimilarity(str1: string, str2: string): number;
export declare function fuzzySearch(needle: string, haystack: string, threshold?: number): {
    start: number;
    end: number;
    similarity: number;
    matched: string;
} | null;
export declare function contextAwareFuzzySearch(needle: string, haystack: string, prefix?: string, suffix?: string, threshold?: number): {
    start: number;
    end: number;
    similarity: number;
    matched: string;
} | null;
//# sourceMappingURL=string.d.ts.map