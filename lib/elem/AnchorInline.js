import { adjustColorBrightness } from "../utils/color";
import { AnchorElement } from "./AnchorElement";
export class AnchorInline extends AnchorElement {
    constructor(anchor) {
        super(anchor);
    }
    render() {
        this.dataset.id = this.anchor.id;
        this.style.color = this.anchor.fgColor;
        this.style.backgroundColor = this.anchor.bgColor;
        this.setAttribute("tabindex", "0");
        if (this.anchor.changed)
            this.setAttribute("data-changed", "");
        else
            this.removeAttribute("data-changed");
    }
    toggleFocus(focus) {
        if (focus)
            this.setAttribute("data-focused", "");
        else
            this.removeAttribute("data-focused");
    }
    toggleHover(hover) {
        if (hover)
            this.style.backgroundColor = adjustColorBrightness(this.anchor.bgColor, -10);
        else
            this.style.backgroundColor = this.anchor.bgColor;
    }
    destroy() {
        const parentNode = this.parentNode;
        if (parentNode) {
            this.replaceWith(document.createTextNode(this.textContent));
            parentNode.normalize();
        }
    }
}
//# sourceMappingURL=AnchorInline.js.map