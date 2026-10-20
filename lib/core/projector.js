import { DTAError } from "./types";
export class TreeProjector {
    project(tree, classifier) {
        const chunks = [];
        const segments = [];
        let offset = 0;
        const visit = (node) => {
            if (classifier(node) === "ignore")
                return;
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
    isValidTextRange(projection, range) {
        if (range.start < 0 || range.start > range.end || range.end > projection.text.length)
            return false;
        return true;
    }
    isValidTreeRange(projection, range) {
        const textRange = this.tryMapTreeToText(projection, range);
        return textRange !== null;
    }
    mapTextToTree(projection, range) {
        if (!this.isValidTextRange(projection, range))
            throw new DTAError("TextRange is not valid for this projection.");
        let startPoint;
        let endPoint;
        for (const segment of projection.segments) {
            const { node, text } = segment;
            if (!startPoint && text.start <= range.start && range.start <= text.end) {
                startPoint = { node, offset: range.start - text.start };
            }
            if (!endPoint && text.start <= range.end && range.end <= text.end) {
                endPoint = { node, offset: range.end - text.start };
            }
            if (startPoint && endPoint)
                break;
        }
        return {
            start: startPoint,
            end: endPoint,
        };
    }
    mapTreeToText(projection, range) {
        const textRange = this.tryMapTreeToText(projection, range);
        if (!textRange)
            throw new DTAError("TreeRange is not valid for this projection.");
        return textRange;
    }
    tryMapTreeToText(projection, range) {
        if (range.start.offset < 0 || range.start.offset > range.start.node.text.length || range.end.offset < 0 || range.end.offset > range.end.node.text.length)
            return null;
        let startSegment;
        let endSegment;
        for (const segment of projection.segments) {
            if (segment.node === range.start.node) {
                startSegment = segment;
            }
            if (segment.node === range.end.node) {
                endSegment = segment;
            }
            if (startSegment && endSegment)
                break;
        }
        if (!startSegment || !endSegment)
            return null;
        return {
            start: startSegment.text.start + range.start.offset,
            end: endSegment.text.start + range.end.offset,
        };
    }
}
//# sourceMappingURL=projector.js.map