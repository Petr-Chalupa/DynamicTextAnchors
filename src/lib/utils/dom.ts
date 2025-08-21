import { DTARange, MergeDirection, RangeIntersection, Segment, TextIndex } from "../core/types";

export function getSelection(): Selection | null {
    const selection = window.getSelection();
    return selection && selection.rangeCount > 0 ? selection : null;
}

export function buildTextIndex(root: Node): TextIndex {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);

    let text = "";
    const segments: Segment[] = [];
    let current = walker.nextNode() as Text | null;
    while (current) {
        const start = text.length;
        text += current.data;
        segments.push({ node: current, start, end: text.length });
        current = walker.nextNode() as Text | null;
    }
    return { text, segments };
}

function domToPos(container: Node, offset: number, segments: Segment[]): number {
    if (container.nodeType != Node.TEXT_NODE) return 0;

    const t = container as Text;
    const seg = segments.find((s) => s.node === t);
    return seg ? seg.start + Math.min(offset, t.data.length) : 0;
}

function posToDom(pos: number, segments: Segment[]): { node: Text; offset: number } | null {
    for (const seg of segments) {
        if (pos >= seg.start && pos <= seg.end) {
            return { node: seg.node, offset: pos - seg.start };
        }
    }
    return null;
}

export function serializeRange(range: Range, root: Element, contextLen = 32) {
    const { text, segments } = buildTextIndex(root);

    let start = domToPos(range.startContainer, range.startOffset, segments);
    let end = domToPos(range.endContainer, range.endOffset, segments);
    start = Math.max(0, Math.min(start, end));
    end = Math.max(0, Math.max(start, end));

    const exact = text.slice(start, end);
    const prefix = text.slice(Math.max(0, start - contextLen), start);
    const suffix = text.slice(end, Math.min(text.length, end + contextLen));

    return { start, end, quote: { exact, prefix, suffix, contextLen } };
}

export function deserializeRange(range: DTARange, root: Element): Range | null {
    const { text, segments } = buildTextIndex(root);

    // Exact search
    if (range.end <= text.length && text.slice(range.start, range.end) === range.quote.exact) {
        const startDom = posToDom(range.start, segments);
        const endDom = posToDom(range.end, segments);
        if (startDom && endDom) {
            const r = document.createRange();
            r.setStart(startDom.node, startDom.offset);
            r.setEnd(endDom.node, endDom.offset);
            return r;
        }
    }

    // Search by quote
    const idx = text.indexOf(range.quote.exact);
    if (idx !== -1) {
        const s = idx;
        const e = idx + range.quote.exact.length;
        const startDom = posToDom(s, segments);
        const endDom = posToDom(e, segments);
        if (startDom && endDom) {
            const r = document.createRange();
            r.setStart(startDom.node, startDom.offset);
            r.setEnd(endDom.node, endDom.offset);
            return r;
        }
    }

    return null;
}

export function rangeIntersects(existing: DTARange, incoming: DTARange, fullText: string): RangeIntersection {
    if (existing.end <= incoming.start || existing.start >= incoming.end) {
        return { type: "none" };
    }

    if (existing.start >= incoming.start && existing.end <= incoming.end) {
        return { type: "full:over" };
    }

    if (existing.start <= incoming.start && existing.end >= incoming.end) {
        return { type: "full:inner" };
    }

    const start = existing.start < incoming.start ? existing.start : incoming.end;
    const end = existing.end > incoming.end ? existing.end : incoming.start;
    const contextLen = existing.quote.contextLen;

    const trimmedExisting: DTARange = {
        start,
        end,
        quote: {
            exact: fullText.slice(start, end),
            prefix: fullText.slice(Math.max(0, start - contextLen), start),
            suffix: fullText.slice(end, end + contextLen),
            contextLen,
        },
    };
    return { type: "partial", trimmedExisting };
}

export function mergeRange(survivor: DTARange, other: DTARange, direction: MergeDirection): DTARange {
    return {
        start: Math.min(survivor.start, other.start),
        end: Math.max(survivor.end, other.end),
        quote: {
            exact: direction === "left" ? other.quote.exact.concat(survivor.quote.exact) : survivor.quote.exact.concat(other.quote.exact),
            prefix: direction === "left" ? other.quote.prefix : survivor.quote.prefix,
            suffix: direction === "left" ? survivor.quote.prefix : other.quote.prefix,
            contextLen: survivor.quote.contextLen,
        },
    } as DTARange;
}

export function findFirstTextNode(root: Node): Text | null {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    return walker.nextNode() as Text | null;
}

export function findLastTextNode(root: Node): Text | null {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);

    let last: Text | null = null;
    let current: Node | null = walker.nextNode();
    while (current) {
        last = current as Text;
        current = walker.nextNode();
    }

    return last;
}

export function getAllTextNodes(range: Range): Text[] {
    const container = range.commonAncestorContainer.parentNode;
    if (!container) return [];

    const treeWalker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
        acceptNode(node: Node) {
            return range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        },
    });

    const nodes: Text[] = [];
    let current: Node | null = treeWalker.nextNode();
    while (current) {
        nodes.push(current as Text);
        current = treeWalker.nextNode();
    }

    return nodes;
}

// export function compareNodePositions(nodeA: Node, nodeB: Node): number {
//     if (nodeA.isSameNode(nodeB)) return 0;

//     const position = nodeA.compareDocumentPosition(nodeB);
//     if (position & Node.DOCUMENT_POSITION_FOLLOWING || position & Node.DOCUMENT_POSITION_CONTAINED_BY) {
//         return -1;
//     } else if (position & Node.DOCUMENT_POSITION_PRECEDING || position & Node.DOCUMENT_POSITION_CONTAINS) {
//         return 1;
//     } else {
//         return 0;
//     }
// }
