// -------------------------------
// TREE ABSTRACTION
// -------------------------------

interface NodeBase<T extends "text" | "container"> {
    readonly type: T;
    readonly kind: string;
}

export interface TextNode extends NodeBase<"text"> {
    readonly text: string;
}

export interface ContainerNode extends NodeBase<"container"> {
    readonly children: readonly TreeNode[];
}

export type TreeNode = TextNode | ContainerNode;

// -------------------------------
// TREE PROJECTION
// -------------------------------

export interface TreePoint {
    readonly node: TextNode;
    readonly offset: number;
}

export interface TreeRange {
    readonly start: TreePoint;
    readonly end: TreePoint;
}

export interface TextRange {
    readonly start: number;
    readonly end: number;
}

export interface Segment {
    readonly node: TextNode;
    readonly text: TextRange;
}

export interface Projection {
    readonly text: string;
    readonly segments: readonly Segment[];
}

export type ProjectionPolicy = "include" | "ignore";

export type ProjectionClassifier = (node: TreeNode) => ProjectionPolicy;

export interface ITreeProjector {
    project(tree: TreeNode, classifier: ProjectionClassifier): Projection;
    isValidTextRange(projection: Projection, range: TextRange): boolean;
    isValidTreeRange(projection: Projection, range: TreeRange): boolean;
    mapTextToTree(projection: Projection, range: TextRange): TreeRange;
    mapTreeToText(projection: Projection, range: TreeRange): TextRange;
}

// -------------------------------
// TREE ADAPTER
// -------------------------------

export interface ITreeAdapter<TDocument, TRange> {
    toTree(document: TDocument): TreeNode;
    toTreeRange(tree: TreeNode, range: TRange): TreeRange;
    fromTreeRange(tree: TreeNode, range: TreeRange): TRange;
}

// -------------------------------
// ANCHOR
// -------------------------------

export interface Anchor<TMetadata = unknown> {
    readonly prefix: string;
    readonly exact: string;
    readonly suffix: string;
    readonly referenceRange?: TextRange;
    readonly metadata?: TMetadata;
}

// -------------------------------
// ANCHOR RESOLUTION
// -------------------------------

export type AnchorResolutionMethod = "reference" | "exact" | "shift" | "fuzzy";

interface AnchorResolutionBase<TStatus extends "resolved" | "orphaned", TMetadata = unknown> {
    readonly status: TStatus;
    readonly source: Anchor<TMetadata>;
    readonly confidence: number;
    readonly method: AnchorResolutionMethod;
}

export type AnchorResolution<TMetadata = unknown> =
    | (AnchorResolutionBase<"resolved", TMetadata> & {
          readonly target: Anchor<TMetadata>;
          readonly range: TextRange;
      })
    | AnchorResolutionBase<"orphaned", TMetadata>;

interface ResolverOptionsBase {
    readonly enabled: boolean;
    readonly minConfidence: number;
}

export interface ResolveOptions {
    readonly reference: ResolverOptionsBase;
    readonly exact: ResolverOptionsBase;
    readonly shift: ResolverOptionsBase;
    readonly fuzzy: ResolverOptionsBase & {
        readonly contextWindow: number;
        readonly algorithm: "levenshtein" | "bitap";
    };
}

// -------------------------------
// DTA
// -------------------------------

export interface DTAConfiguration<TDocument, TRange> {
    readonly root: TDocument;
    readonly adapter: ITreeAdapter<TDocument, TRange>;
    readonly classifier: ProjectionClassifier;
    readonly defaultResolveOptions: ResolveOptions;
}

export interface IDTA<TDocument, TRange> {
    readonly config: DTAConfiguration<TDocument, TRange>;
    readonly tree: TreeNode;
    readonly projector: ITreeProjector;
    readonly projection: Projection;
    //
    configure(config: Partial<DTAConfiguration<TDocument, TRange>>): void;
    refresh(): void;
    createAnchor<TMetadata = unknown>(range: TRange): Anchor<TMetadata>;
    resolve<TMetadata = unknown>(anchors: Anchor<TMetadata>[], options?: Partial<ResolveOptions>): AnchorResolution<TMetadata>[];
}

export class DTAError extends Error {
    constructor(message?: string, options?: ErrorOptions) {
        super(message, options);
        this.name = this.constructor.name;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
