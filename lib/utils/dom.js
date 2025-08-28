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
export function serializeRange(range, root, contextLen = 32) {
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
export function deserializeRange(range, root) {
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
//# sourceMappingURL=dom.js.map