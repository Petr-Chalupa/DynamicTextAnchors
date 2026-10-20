import type { ITreeAdapter, TreeNode, TreeRange } from "../core/types";
export declare class HtmlAdapter implements ITreeAdapter<Node, Range> {
    private readonly treeNodes;
    private readonly domNodes;
    toTree(node: Node): TreeNode;
    toTreeRange(tree: TreeNode, range: Range): TreeRange;
    fromTreeRange(tree: TreeNode, range: TreeRange): Range;
    private toTreePoint;
    private containsTextNode;
    private firstTextNode;
    private lastTextNode;
}
//# sourceMappingURL=html.d.ts.map