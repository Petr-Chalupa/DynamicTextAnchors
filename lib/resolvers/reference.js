export class ReferenceResolver {
    method = "reference";
    enabled = true;
    minConfidence = 0.6;
    resolve(projection, anchor) {
        const { prefix, exact, suffix, referenceRange } = anchor;
        const reference = prefix + exact + suffix;
        if (!reference.length)
            return null;
        let bestRange = null;
        let bestDrift = Infinity;
        let searchStart = 0;
        while (searchStart <= projection.text.length - reference.length) {
            const matchIndex = projection.text.indexOf(reference, searchStart);
            if (matchIndex === -1)
                break;
            const start = matchIndex + prefix.length;
            const end = start + exact.length;
            const drift = referenceRange
                ? Math.max(Math.abs(start - referenceRange.start), Math.abs(end - referenceRange.end))
                : 0;
            if (drift < bestDrift) {
                bestDrift = drift;
                bestRange = { start, end };
            }
            if (drift === 0)
                break;
            searchStart = matchIndex + 1;
        }
        if (!bestRange)
            return null;
        const decayWindow = Math.max(1, reference.length);
        const confidence = Math.max(0, 1 - bestDrift / decayWindow);
        return {
            range: bestRange,
            confidence,
        };
    }
}
//# sourceMappingURL=reference.js.map