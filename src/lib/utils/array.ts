export function splitArrayToChunks<T>(array: T[], delimiter: T, options: { preserveDelimiter?: boolean } = {}): T[][] {
    if (!Array.isArray(array)) throw new Error("Input must be an array");

    const { preserveDelimiter = false } = options;
    const chunks: T[][] = [];
    let currentChunk: T[] = [];

    for (const item of array) {
        if (item === delimiter) {
            if (currentChunk.length > 0) {
                chunks.push([...currentChunk]);
            }
            currentChunk = [];

            if (preserveDelimiter) {
                chunks.push([item]);
            }
        } else {
            currentChunk.push(item);
        }
    }

    if (currentChunk.length > 0) {
        chunks.push(currentChunk);
    }

    return chunks;
}
