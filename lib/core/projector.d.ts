import { type Projection, type ProjectionClassifier, type TextRange, type TreeNode, type ITreeProjector, type TreeRange } from "./types";
export declare class TreeProjector implements ITreeProjector {
    project(tree: TreeNode, classifier: ProjectionClassifier): Projection;
    isValidTextRange(projection: Projection, range: TextRange): boolean;
    isValidTreeRange(projection: Projection, range: TreeRange): boolean;
    mapTextToTree(projection: Projection, range: TextRange): TreeRange;
    mapTreeToText(projection: Projection, range: TreeRange): TextRange;
    private tryMapTreeToText;
}
//# sourceMappingURL=projector.d.ts.map