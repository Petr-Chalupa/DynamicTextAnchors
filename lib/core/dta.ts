import { TreeProjector } from "./projector";
import { type Anchor, type AnchorResolution, type IDTA, type DTAConfiguration, type Projection, type ResolveOptions, type TreeNode, type ITreeProjector } from "./types";

export class DTA<TDocument, TRange> implements IDTA<TDocument, TRange> {
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

    createAnchor<TMetadata = unknown>(range: TRange): Anchor<TMetadata> {
        throw new Error("Method not implemented.");
    }

    resolve<TMetadata = unknown>(anchors: Anchor<TMetadata>[], options?: Partial<ResolveOptions>): AnchorResolution<TMetadata>[] {
        throw new Error("Method not implemented.");
    }
}
