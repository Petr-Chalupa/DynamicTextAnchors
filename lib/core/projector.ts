import type { Projection, ProjectionClassifier, Segment, TextRange, TreeNode, TreeProjector, TreeRange } from "./types";

export class Projector implements TreeProjector {
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

    mapTextToTree(projection: Projection, range: TextRange): TreeRange {
        throw new Error("Method not implemented.");
    }

    mapTreeToText(projection: Projection, range: TreeRange): TextRange {
        throw new Error("Method not implemented.");
    }
}
