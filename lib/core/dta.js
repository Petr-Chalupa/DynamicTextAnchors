import { TreeProjector } from "./projector";
import {} from "./types";
export class DTA {
    static ANCHOR_CTX_LENGTH = 32;
    //
    config;
    tree;
    projector;
    projection;
    constructor(config) {
        this.config = config;
        this.projector = new TreeProjector();
        this.refresh();
    }
    configure(config) {
        Object.assign(this.config, config);
        this.refresh();
    }
    refresh() {
        const { root, adapter, classifier } = this.config;
        this.tree = adapter.toTree(root);
        this.projection = this.projector.project(this.tree, classifier);
    }
    createAnchor(range, metadata) {
        const treeRange = this.config.adapter.toTreeRange(this.tree, range);
        const textRange = this.projector.mapTreeToText(this.projection, treeRange);
        return this.createAnchorFromTextRange(textRange, metadata);
    }
    createAnchorFromTextRange(range, metadata) {
        const { start, end } = range;
        const text = this.projection.text;
        return {
            prefix: text.slice(Math.max(0, start - DTA.ANCHOR_CTX_LENGTH), start),
            exact: text.slice(start, end),
            suffix: text.slice(end, Math.min(text.length, end + DTA.ANCHOR_CTX_LENGTH)),
            referenceRange: range,
            metadata,
        };
    }
    resolve(anchors) {
        const anchorResolutions = [];
        anchorLoop: for (const anchor of anchors) {
            for (const resolver of this.config.resolvers) {
                if (!resolver.enabled)
                    continue;
                const match = resolver.resolve(this.projection, anchor);
                if (!match || match.confidence < resolver.minConfidence)
                    continue;
                anchorResolutions.push({
                    status: "resolved",
                    source: anchor,
                    target: this.createAnchorFromTextRange(match.range, anchor.metadata),
                    range: match.range,
                    confidence: match.confidence,
                    method: resolver.method,
                });
                continue anchorLoop;
            }
            anchorResolutions.push({
                status: "orphaned",
                source: anchor,
            });
        }
        return anchorResolutions;
    }
}
//# sourceMappingURL=dta.js.map