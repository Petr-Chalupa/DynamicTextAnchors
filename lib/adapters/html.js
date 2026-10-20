import { DTAError } from "../core/types";
export class HtmlAdapter {
    treeNodes = new WeakMap();
    domNodes = new WeakMap();
    toTree(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const treeNode = {
                type: "text",
                kind: "text",
                text: node.nodeValue ?? "",
            };
            this.treeNodes.set(node, treeNode);
            this.domNodes.set(treeNode, node);
            return treeNode;
        }
        const treeNode = {
            type: "container",
            kind: node.nodeName.toLowerCase(),
            children: Array.from(node.childNodes, (child) => this.toTree(child)),
        };
        this.treeNodes.set(node, treeNode);
        return treeNode;
    }
    toTreeRange(tree, range) {
        return {
            start: this.toTreePoint(tree, range.startContainer, range.startOffset, true),
            end: this.toTreePoint(tree, range.endContainer, range.endOffset, false),
        };
    }
    fromTreeRange(tree, range) {
        if (!this.containsTextNode(tree, range.start.node) || !this.containsTextNode(tree, range.end.node)) {
            throw new DTAError("TreeRange does not belong to this tree.");
        }
        const startNode = this.domNodes.get(range.start.node);
        const endNode = this.domNodes.get(range.end.node);
        if (!startNode || !endNode)
            throw new DTAError("TreeRange does not belong to this adapter.");
        const domRange = startNode.ownerDocument.createRange();
        domRange.setStart(startNode, range.start.offset);
        domRange.setEnd(endNode, range.end.offset);
        return domRange;
    }
    toTreePoint(tree, container, offset, start) {
        const treeNode = this.treeNodes.get(container);
        if (!treeNode) {
            throw new DTAError("DOM range does not belong to this adapter.");
        }
        if (treeNode.type === "text") {
            if (!this.containsTextNode(tree, treeNode)) {
                throw new DTAError("DOM range does not belong to the tree.");
            }
            if (offset < 0 || offset > treeNode.text.length) {
                throw new DTAError("DOM range contains an invalid text offset.");
            }
            return { node: treeNode, offset };
        }
        const child = container.childNodes[start ? offset : offset - 1];
        const boundaryNode = child
            ? start
                ? this.firstTextNode(child)
                : this.lastTextNode(child)
            : start
                ? this.firstTextNode(container)
                : this.lastTextNode(container);
        if (!boundaryNode || !this.containsTextNode(tree, boundaryNode)) {
            throw new DTAError("DOM range does not belong to the tree.");
        }
        return { node: boundaryNode, offset: start ? 0 : boundaryNode.text.length };
    }
    containsTextNode(tree, target) {
        if (tree.type === "text")
            return tree === target;
        return tree.children.some((child) => this.containsTextNode(child, target));
    }
    firstTextNode(node) {
        const treeNode = this.treeNodes.get(node);
        if (treeNode?.type === "text")
            return treeNode;
        for (const child of node.childNodes) {
            const textNode = this.firstTextNode(child);
            if (textNode)
                return textNode;
        }
        return null;
    }
    lastTextNode(node) {
        const treeNode = this.treeNodes.get(node);
        if (treeNode?.type === "text")
            return treeNode;
        for (let i = node.childNodes.length - 1; i >= 0; i--) {
            const textNode = this.lastTextNode(node.childNodes[i]);
            if (textNode)
                return textNode;
        }
        return null;
    }
}
//# sourceMappingURL=html.js.map