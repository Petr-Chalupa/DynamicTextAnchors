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
        const textRange = this.tryMapTreeToText(projection, range);
        return textRange !== null;
    }

    mapTextToTree(projection: Projection, range: TextRange): TreeRange {
        if (!this.isValidTextRange(projection, range)) throw new DTAError("TextRange is not valid for this projection.");

        let startPoint: TreePoint | undefined;
        let endPoint: TreePoint | undefined;

        for (const segment of projection.segments) {
            const { node, text } = segment;

            if (!startPoint && text.start <= range.start && range.start <= text.end) {
                startPoint = { node, offset: range.start - text.start };
            }

            if (!endPoint && text.start <= range.end && range.end <= text.end) {
                endPoint = { node, offset: range.end - text.start };
            }

            if (startPoint && endPoint) break;
        }

        return {
            start: startPoint!,
            end: endPoint!,
        };
    }

    mapTreeToText(projection: Projection, range: TreeRange): TextRange {
        const textRange = this.tryMapTreeToText(projection, range);
        if (!textRange) throw new DTAError("TreeRange is not valid for this projection.");

        return textRange;
    }

    private tryMapTreeToText(projection: Projection, range: TreeRange): TextRange | null {
        if (range.start.offset < 0 || range.start.offset > range.start.node.text.length || range.end.offset < 0 || range.end.offset > range.end.node.text.length) return null;

        let startSegment: Segment | undefined;
        let endSegment: Segment | undefined;

        for (const segment of projection.segments) {
            if (segment.node === range.start.node) {
                startSegment = segment;
            }

            if (segment.node === range.end.node) {
                endSegment = segment;
            }

            if (startSegment && endSegment) break;
        }

        if (!startSegment || !endSegment) return null;

        return {
            start: startSegment.text.start + range.start.offset,
            end: endSegment.text.start + range.end.offset,
        };
    }
}
