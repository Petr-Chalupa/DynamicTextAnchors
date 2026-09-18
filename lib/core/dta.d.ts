import { type Anchor, type AnchorResolution, type IDTA, type DTAConfiguration, type Projection, type TreeNode, type ITreeProjector } from "./types";
export declare class DTA<TDocument, TRange> implements IDTA<TDocument, TRange> {
    private static readonly ANCHOR_CTX_LENGTH;
    config: DTAConfiguration<TDocument, TRange>;
    tree: TreeNode;
    projector: ITreeProjector;
    projection: Projection;
    constructor(config: DTAConfiguration<TDocument, TRange>);
    configure(config: Partial<DTAConfiguration<TDocument, TRange>>): void;
    refresh(): void;
    createAnchor<TMetadata>(range: TRange, metadata?: TMetadata): Anchor<TMetadata>;
    private createAnchorFromTextRange;
    resolve<TMetadata>(anchors: Anchor<TMetadata>[]): AnchorResolution<TMetadata>[];
}
//# sourceMappingURL=dta.d.ts.map