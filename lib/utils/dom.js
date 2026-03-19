import { fuzzySearch, contextAwareFuzzySearch } from "./string";
export function getSelection() {
    const selection = window.getSelection();
    return selection && selection.rangeCount > 0 ? selection : null;
}
export function buildTextIndex(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    let text = "";
    const segments = [];
    let current = walker.nextNode();
    while (current) {
        const start = text.length;
        text += current.data;
        segments.push({ node: current, start, end: text.length });
        current = walker.nextNode();
    }
    return { text, segments };
}
function domToPos(container, offset, segments) {
    if (container.nodeType != Node.TEXT_NODE)
        return 0;
    const t = container;
    const seg = segments.find((s) => s.node === t);
    return seg ? seg.start + Math.min(offset, t.data.length) : 0;
}
function posToDom(pos, segments) {
    for (const seg of segments) {
        if (pos >= seg.start && pos <= seg.end) {
            return { node: seg.node, offset: pos - seg.start };
        }
    }
    return null;
}
function createRange(start, end, segments) {
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
export function serializeRange(range, root, contextLen = 32) {
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
export function deserializeRange(range, root) {
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
export function rangeIntersects(existing, incoming, fullText) {
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
    const trimmedExisting = {
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
export function mergeRange(survivor, other, direction) {
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
    };
}
export function findFirstTextNode(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    return walker.nextNode();
}
export function findLastTextNode(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    let last = null;
    let current = walker.nextNode();
    while (current) {
        last = current;
        current = walker.nextNode();
    }
    return last;
}
export function getAllTextNodes(range) {
    const container = range.commonAncestorContainer.parentNode;
    if (!container)
        return [];
    const treeWalker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
            return range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        },
    });
    const nodes = [];
    let current = treeWalker.nextNode();
    while (current) {
        nodes.push(current);
        current = treeWalker.nextNode();
    }
    return nodes;
}
//# sourceMappingURL=dom.js.map