import { AnchorElement } from "./AnchorElement";
export class AnchorList extends AnchorElement {
    constructor(anchor) {
        super(anchor);
    }
    render() {
        super.render();
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