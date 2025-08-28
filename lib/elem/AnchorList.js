import { AnchorElement } from "./AnchorElement";
export class AnchorList extends AnchorElement {
    constructor(anchor) {
        super(anchor);
    }
    render() {
        this.dataset.id = this.anchor.id;
        if (this.anchor.changed)
            this.setAttribute("data-changed", "");
        else
            this.removeAttribute("data-changed");
        this.innerHTML = `
            <li>${this.anchor.range.quote.exact}</li>
        `;
    }
    toggleFocus(focus) {
        return;
    }
    toggleHover(hover) {
        return;
    }
    destroy() {
        this.remove();
    }
}
//# sourceMappingURL=AnchorList.js.map