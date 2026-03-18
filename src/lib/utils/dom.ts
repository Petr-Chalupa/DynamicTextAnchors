import { TextIndex, Segment, DTARange, RangeIntersection, MergeDirection } from "../types";
import { fuzzySearch, contextAwareFuzzySearch } from "./string";

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

function createRange(start: number, end: number, segments: Segment[]): Range | null {
    const startDom = posToDom(start, segments);
    const endDom = posToDom(end, segments);
    if (startDom && endDom) {
        const r = document.createRange();
        r.setStart(startDom.node, startDom.offset);
        r.setEnd(endDom.node, endDom.offset);
        return r;
    }
    return null;
}

export function serializeRange(range: Range, root: Element, contextLen = 32): DTARange {
    const { text, segments } = buildTextIndex(root);

    let start = domToPos(range.startContainer, range.startOffset, segments);
    let end = domToPos(range.endContainer, range.endOffset, segments);
    start = Math.max(0, Math.min(start, end));
    end = Math.max(0, Math.max(start, end));

    const exact = text.slice(start, end);
    const prefix = text.slice(Math.max(0, start - contextLen), start);
    const suffix = text.slice(end, Math.min(text.length, end + contextLen));

    return {
        start,
        end,
        quote: { exact, prefix, suffix, contextLen },
        matchConfidence: 1.0,
    };
}

export function deserializeRange(range: DTARange, root: Element): Range | null {
    const { text, segments } = buildTextIndex(root);

    // Try exact position match
    if (range.end <= text.length && text.slice(range.start, range.end) === range.quote.exact) {
        const domRange = createRange(range.start, range.end, segments);
        if (domRange) {
            range.matchConfidence = 1.0;
            return domRange;
        }
    }

    // Try exact quote search (moved but unchanged)
    const exactIdx = text.indexOf(range.quote.exact);
    if (exactIdx !== -1) {
        const domRange = createRange(exactIdx, exactIdx + range.quote.exact.length, segments);
        if (domRange) {
            range.matchConfidence = 0.95;
            return domRange;
        }
    }

    // Context-aware fuzzy search
    if (range.quote.prefix || range.quote.suffix) {
        const contextMatch = contextAwareFuzzySearch(range.quote.exact, text, range.quote.prefix, range.quote.suffix, 0.85);

        if (contextMatch) {
            const domRange = createRange(contextMatch.start, contextMatch.end, segments);
            if (domRange) {
                range.matchConfidence = contextMatch.similarity;
                return domRange;
            }
        }
    }

    // Full-text fuzzy search
    const fuzzyMatch = fuzzySearch(range.quote.exact, text, 0.85);
    if (fuzzyMatch) {
        const domRange = createRange(fuzzyMatch.start, fuzzyMatch.end, segments);
        if (domRange) {
            range.matchConfidence = fuzzyMatch.similarity;
            return domRange;
        }
    }

    // All strategies failed
    range.matchConfidence = 0;
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
        matchConfidence: existing.matchConfidence,
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
        matchConfidence: Math.min(survivor.matchConfidence ?? 1, other.matchConfidence ?? 1),
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
