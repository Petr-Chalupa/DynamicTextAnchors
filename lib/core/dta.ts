import { TreeProjector } from "./projector";
import {
    type Anchor,
    type AnchorResolution,
    type IDTA,
    type DTAConfiguration,
    type Projection,
    type ResolvePipelineOptions,
    type TreeNode,
    type ITreeProjector,
    type IAnchorResolver,
    type TextRange,
} from "./types";

export class DTA<TDocument, TRange> implements IDTA<TDocument, TRange> {
    private static readonly ANCHOR_CTX_LENGTH = 32;
    private static readonly RESOLVERS: readonly IAnchorResolver[] = [];
    //
    config: DTAConfiguration<TDocument, TRange>;
    tree!: TreeNode;
    projector: ITreeProjector;
    projection!: Projection;

    constructor(config: DTAConfiguration<TDocument, TRange>) {
        this.config = config;
        this.projector = new TreeProjector();
        this.refresh();
    }

    configure(config: Partial<DTAConfiguration<TDocument, TRange>>): void {
        Object.assign(this.config, config);
        this.refresh();
    }

    refresh(): void {
        const { root, adapter, classifier } = this.config;
        this.tree = adapter.toTree(root);
        this.projection = this.projector.project(this.tree, classifier);
    }

    createAnchor<TMetadata>(range: TRange, metadata?: TMetadata): Anchor<TMetadata> {
        const treeRange = this.config.adapter.toTreeRange(this.tree, range);
        const textRange = this.projector.mapTreeToText(this.projection, treeRange);

        return this.createAnchorFromTextRange(textRange, metadata);
    }

    private createAnchorFromTextRange<TMetadata>(range: TextRange, metadata?: TMetadata): Anchor<TMetadata> {
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

    resolve<TMetadata>(anchors: Anchor<TMetadata>[], options?: Partial<ResolvePipelineOptions>): AnchorResolution<TMetadata>[] {
        const { reference, exact, shift, fuzzy } = this.config.defaultResolvePipelineOptions;
        const resolvePipelineOptions: ResolvePipelineOptions = {
            reference: { ...reference, ...options?.reference },
            exact: { ...exact, ...options?.exact },
            shift: { ...shift, ...options?.shift },
            fuzzy: { ...fuzzy, ...options?.fuzzy },
        };

        const anchorResolutions: AnchorResolution<TMetadata>[] = [];

        anchorLoop: for (const anchor of anchors) {
            for (const resolver of DTA.RESOLVERS) {
                const resolverOptions = resolvePipelineOptions[resolver.method];
                if (!resolverOptions.enabled) continue;

                const match = resolver.resolve(this.projection, anchor, resolverOptions);
                if (!match || match.confidence < resolverOptions.minConfidence) continue;

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
