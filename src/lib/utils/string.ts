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
                matrix[i - 1][j - 1] + cost // substitution
            );
        }
    }

    const maxLength = Math.max(len1, len2);
    return (maxLength - matrix[len1][len2]) / maxLength;
}
