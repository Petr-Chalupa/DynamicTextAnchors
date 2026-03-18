export function normalizeString(str: string): string {
    if (typeof str !== "string") throw new Error("Input must be a string");

    let normalized = str;
    // Remove diacritics (accents, etc.)
    normalized = normalized.normalize("NFD").replace(/[\p{Diacritic}]/gu, "");
    // Remove punctuation
    normalized = normalized.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
    // Remove numbers
    normalized = normalized.replace(/\d/g, "");
    // Collapse whitespace
    normalized = normalized.replace(/\s{2,}/g, " ");
    // Convert to lowercase
    normalized = normalized.toLowerCase();
    return normalized.trim();
}

export function escapeRegExp(str: string): string {
    if (typeof str !== "string") throw new Error("Input must be a string");

    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function calculateStringSimilarity(str1: string, str2: string): number {
    if (typeof str1 !== "string" || typeof str2 !== "string") throw new Error("Both inputs must be strings");

    if (str1 === str2) return 1;
    if (str1.length === 0 || str2.length === 0) return 0;

    const matrix: number[][] = [];
    const len1 = str1.length;
    const len2 = str2.length;

    // Initialize matrix
    for (let i = 0; i <= len1; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
        matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            const cost = str1.charAt(i - 1) === str2.charAt(j - 1) ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1, // deletion
                matrix[i][j - 1] + 1, // insertion
                matrix[i - 1][j - 1] + cost, // substitution
            );
        }
    }

    const maxLength = Math.max(len1, len2);
    return (maxLength - matrix[len1][len2]) / maxLength;
}

export function fuzzySearch(needle: string, haystack: string, threshold: number = 0.85): { start: number; end: number; similarity: number; matched: string } | null {
    if (typeof needle !== "string" || typeof haystack !== "string") throw new Error("Both needle and haystack must be strings");

    if (needle.length === 0 || haystack.length === 0) return null;
    if (needle.length > haystack.length) return null;

    let bestMatch = null;
    let bestSimilarity = threshold;

    const needleLen = needle.length;
    const maxVariance = Math.floor(needleLen * 0.2); // Allow 20% length difference

    // Try different window sizes
    for (let size = Math.max(1, needleLen - maxVariance); size <= needleLen + maxVariance; size++) {
        // Slide the window
        for (let i = 0; i <= haystack.length - size; i++) {
            const candidate = haystack.slice(i, i + size);
            const similarity = calculateStringSimilarity(needle, candidate);

            if (similarity > bestSimilarity) {
                bestSimilarity = similarity;
                bestMatch = {
                    start: i,
                    end: i + size,
                    similarity,
                    matched: candidate,
                };
            }
        }
    }

    return bestMatch;
}

export function contextAwareFuzzySearch(
    needle: string,
    haystack: string,
    prefix?: string,
    suffix?: string,
    threshold: number = 0.85,
): { start: number; end: number; similarity: number; matched: string } | null {
    if (typeof needle !== "string" || typeof haystack !== "string") throw new Error("Both needle and haystack must be strings");

    if (needle.length === 0 || haystack.length === 0) return null;

    // If no context, fall back to regular fuzzy search
    if (!prefix && !suffix) {
        return fuzzySearch(needle, haystack, threshold);
    }

    let searchStart = 0;
    let searchEnd = haystack.length;

    // Try to find prefix to narrow search range
    if (prefix && prefix.length > 0) {
        const prefixMatch = fuzzySearch(prefix, haystack, Math.max(0.7, threshold - 0.15));
        if (prefixMatch) {
            searchStart = prefixMatch.end;
        }
    }

    // Try to find suffix to narrow search range
    if (suffix && suffix.length > 0) {
        const suffixMatch = fuzzySearch(suffix, haystack.slice(searchStart), Math.max(0.7, threshold - 0.15));
        if (suffixMatch) {
            searchEnd = searchStart + suffixMatch.start;
        }
    }

    // Search within the narrowed range
    const searchRegion = haystack.slice(searchStart, searchEnd);
    const match = fuzzySearch(needle, searchRegion, threshold);

    if (match) {
        return {
            start: searchStart + match.start,
            end: searchStart + match.end,
            similarity: match.similarity,
            matched: match.matched,
        };
    }

    return null;
}
