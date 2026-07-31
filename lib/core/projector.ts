import { type Projection, type ProjectionClassifier, type Segment, type TextRange, type TreeNode, type TreePoint, type ITreeProjector, type TreeRange, DTAError } from "./types";

export class TreeProjector implements ITreeProjector {
    project(tree: TreeNode, classifier: ProjectionClassifier): Projection {
        const chunks: string[] = [];
        const segments: Segment[] = [];
        let offset = 0;

        const visit = (node: TreeNode): void => {
            if (classifier(node) === "ignore") return;

            if (node.type === "text") {
                const start = offset;
                const end = start + node.text.length;

                chunks.push(node.text);
                segments.push({ node, text: { start, end } });

                offset = end;
                return;
            }

            for (const child of node.children) {
                visit(child);
            }
        };

        visit(tree);

        return { text: chunks.join(""), segments };
    }

    isValidTextRange(projection: Projection, range: TextRange): boolean {
        if (range.start < 0 || range.start > range.end || range.end > projection.text.length) return false;
        return true;
    }

    isValidTreeRange(projection: Projection, range: TreeRange): boolean {
        throw new Error("Method not implemented.");
    }

    mapTextToTree(projection: Projection, range: TextRange): TreeRange {
        if (!this.isValidTextRange(projection, range)) throw new DTAError("TextRange is outside the projection.");

        let start: TreePoint | null = null;
        let end: TreePoint | null = null;

        for (const segment of projection.segments) {
            const { node, text } = segment;

            if (!start && text.start <= range.start && range.start <= text.end) {
                start = { node, offset: range.start - text.start };
            }

            if (!end && text.start <= range.end && range.end <= text.end) {
                end = { node, offset: range.end - text.start };
            }

            if (start && end) break;
        }

        return { start: start!, end: end! };
    }

    mapTreeToText(projection: Projection, range: TreeRange): TextRange {
        throw new Error("Method not implemented.");
    }
}
