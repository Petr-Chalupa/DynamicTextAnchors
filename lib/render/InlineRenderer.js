import { Renderer } from "./Renderer";
import { deserializeRange, getAllTextNodes } from "../utils/dom";
import { AnchorInline } from "../elem/AnchorInline";
export class InlineRenderer extends Renderer {
    constructor(root) {
        super(root);
    }
    renderAnchor(anchor) {
        const existingElements = this.renderedAnchors.get(anchor.id);
        if (existingElements && existingElements.length > 0) {
            this.updateAnchor(anchor);
            return;
        }
        const srcRange = deserializeRange(anchor.range, this.root);
        if (!srcRange)
            return;
        const allNodes = this.renderedAnchors.get(anchor.id) || [];
        const textNodes = getAllTextNodes(srcRange);
        textNodes.forEach((textNode) => {
            const parent = textNode.parentNode;
            if (!parent)
                return;
            const fragment = document.createDocumentFragment();
            const startOffset = textNode === srcRange.startContainer ? srcRange.startOffset : 0;
            const endOffset = textNode === srcRange.endContainer ? srcRange.endOffset : textNode.length;
            const beforeText = textNode.textContent?.slice(0, startOffset);
            const anchorText = textNode.textContent?.slice(startOffset, endOffset);
            const afterText = textNode.textContent?.slice(endOffset);
            if (beforeText) {
                fragment.appendChild(document.createTextNode(beforeText));
            }
            if (anchorText) {
                const wrapper = new AnchorInline(anchor);
                wrapper.textContent = anchorText;
                fragment.appendChild(wrapper);
                allNodes.push(wrapper);
            }
            if (afterText) {
                fragment.appendChild(document.createTextNode(afterText));
            }
            parent.insertBefore(fragment, textNode);
            parent.removeChild(textNode);
        });
        if (allNodes.length > 0)
            this.renderedAnchors.set(anchor.id, allNodes);
    }
}
//# sourceMappingURL=InlineRenderer.js.map