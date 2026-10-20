import type { Anchor, IAnchorResolver, Projection, ResolverMatch } from "../core/types";
export declare class ReferenceResolver implements IAnchorResolver {
    readonly method: "reference";
    enabled: boolean;
    minConfidence: number;
    resolve(projection: Projection, anchor: Anchor): ResolverMatch | null;
}
//# sourceMappingURL=reference.d.ts.map