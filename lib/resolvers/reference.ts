import type { Anchor, IAnchorResolver, Projection, ResolverMatch } from "../core/types";

export class ReferenceResolver implements IAnchorResolver {
    readonly method = "reference" as const;
    enabled: boolean = true;
    minConfidence: number = 0.6;

    resolve(projection: Projection, anchor: Anchor): ResolverMatch | null {
        const text = projection.text;
        const { prefix, exact, suffix, referenceRange } = anchor;

        if (!exact.length && !prefix.length && !suffix.length) return null;

        const reference = prefix + exact + suffix;
        const matchIndex = text.indexOf(reference);
        if (matchIndex === -1) return null;

        const start = matchIndex + prefix.length;
        const end = start + exact.length;

        let confidence = 1;
        if (referenceRange) {
            const drift = Math.max(Math.abs(start - referenceRange.start), Math.abs(end - referenceRange.end));
            const decayWindow = Math.max(1, prefix.length + exact.length + suffix.length);
            confidence = Math.max(0, 1 - drift / decayWindow);
        }

        return {
            range: { start, end },
            confidence,
        };
    }
}
