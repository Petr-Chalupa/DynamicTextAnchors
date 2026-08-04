import { TreeProjector } from "./projector";
import { type Anchor, type AnchorResolution, type IDTA, type DTAConfiguration, type Projection, type ResolveOptions, type TreeNode, type ITreeProjector } from "./types";

export class DTA<TDocument, TRange> implements IDTA<TDocument, TRange> {
    private static readonly ANCHOR_CTX_LENGTH = 32;
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

        const { start, end } = textRange;
        const text = this.projection.text;

        return {
            prefix: text.slice(Math.max(0, start - DTA.ANCHOR_CTX_LENGTH), start),
            exact: text.slice(start, end),
            suffix: text.slice(end, Math.min(text.length, end + DTA.ANCHOR_CTX_LENGTH)),
            referenceRange: textRange,
            metadata,
        };
    }

    resolve<TMetadata>(anchors: Anchor<TMetadata>[], options?: Partial<ResolveOptions>): AnchorResolution<TMetadata>[] {
        throw new Error("Method not implemented.");
    }
}
