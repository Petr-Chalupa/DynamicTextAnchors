import type { ITreeAdapter, TextNode, TreeNode, TreePoint, TreeRange } from "../core/types";
import { DTAError } from "../core/types";

export class HtmlAdapter implements ITreeAdapter<Node, Range> {
    private readonly treeNodes = new WeakMap<Node, TreeNode>();
    private readonly domNodes = new WeakMap<TextNode, Text>();

    toTree(document: Node): TreeNode {
        const tree = this.createTreeNode(document);
        this.treeNodes.set(document, tree);
        return tree;
    }

    toTreeRange(tree: TreeNode, range: Range): TreeRange {
        const start = this.toTreePoint(tree, range.startContainer, range.startOffset, true);
        const end = this.toTreePoint(tree, range.endContainer, range.endOffset, false);

        return { start, end };
    }

    fromTreeRange(tree: TreeNode, range: TreeRange): Range {
        const startNode = this.domNodes.get(range.start.node);
        const endNode = this.domNodes.get(range.end.node);
        if (!startNode || !endNode) throw new DTAError("TreeRange does not belong to this adapter.");

        const domRange = startNode.ownerDocument?.createRange();
        if (!domRange) throw new DTAError("TreeRange cannot be converted without an owner document.");

        domRange.setStart(startNode, range.start.offset);
        domRange.setEnd(endNode, range.end.offset);
        return domRange;
    }

    private createTreeNode(node: Node): TreeNode {
        if (node.nodeType === Node.TEXT_NODE) {
            const textNode: TextNode = {
                type: "text",
                kind: "text",
                text: node.nodeValue ?? "",
            };
            this.domNodes.set(textNode, node as Text);
            return textNode;
        }

        const container: TreeNode = {
            type: "container",
            kind: node.nodeName.toLowerCase(),
            children: Array.from(node.childNodes, (child) => this.createTreeNode(child)),
        };
        this.treeNodes.set(node, container);
        return container;
    }

    private toTreePoint(tree: TreeNode, container: Node, offset: number, isStart: boolean): TreePoint {
        const textNode = this.findBoundaryTextNode(container, offset, isStart);
        if (!textNode) throw new DTAError("DOM range does not belong to the projected tree.");

        const domText = this.domNodes.get(textNode);
        if (domText && container === domText) {
            return { node: textNode, offset };
        }

        return {
            node: textNode,
            offset: isStart ? 0 : textNode.text.length,
        };
    }

    private findBoundaryTextNode(container: Node, offset: number, isStart: boolean): TextNode | null {
        if (container.nodeType === Node.TEXT_NODE) {
            return this.findTextNode(container);
        }

        const children = Array.from(container.childNodes);
        if (offset === 0) return this.firstTextNode(container);
        if (offset >= children.length) return this.lastTextNode(container);

        const sibling = children[isStart ? offset : offset - 1];
        return isStart ? this.firstTextNode(sibling) : this.lastTextNode(sibling);
    }

    private findTextNode(node: Node): TextNode | null {
        const treeNode = this.treeNodes.get(node);
        return treeNode?.type === "text" ? treeNode : null;
    }

    private firstTextNode(node: Node): TextNode | null {
        const direct = this.findTextNode(node);
        if (direct) return direct;

        for (const child of node.childNodes) {
            const textNode = this.firstTextNode(child);
            if (textNode) return textNode;
        }

        return null;
    }

    private lastTextNode(node: Node): TextNode | null {
        const direct = this.findTextNode(node);
        if (direct) return direct;

        for (let index = node.childNodes.length - 1; index >= 0; index--) {
            const textNode = this.lastTextNode(node.childNodes[index]);
            if (textNode) return textNode;
        }

        return null;
    }
}
