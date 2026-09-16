import type { Anchor, IAnchorResolver, Projection, ResolverMatch } from "../core/types";

export class ReferenceResolver implements IAnchorResolver {
    readonly method = "reference" as const;
    enabled: boolean = true;
    minConfidence: number = 1;

    resolve(projection: Projection, anchor: Anchor): ResolverMatch | null {
        const text = projection.text;
        const { prefix, exact, suffix } = anchor;

        if (!exact.length && !prefix.length && !suffix.length) return null;

        const reference = prefix + exact + suffix;
        const referenceIndex = text.indexOf(reference);
        if (referenceIndex === -1) return null;

        const start = referenceIndex + prefix.length;
        const end = start + exact.length;
        const confidence = 1;

        return {
            range: { start, end },
            confidence,
        };
    }
}
