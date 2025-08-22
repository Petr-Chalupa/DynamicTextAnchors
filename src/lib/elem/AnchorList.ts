import { AnchorElement } from "./AnchorElement";
import { AnchorI } from "../types";

export class AnchorList extends AnchorElement {
    constructor(anchor: AnchorI) {
        super(anchor);
    }

    render(): void {
        this.dataset.id = this.anchor.id;

        if (this.anchor.changed) this.setAttribute("data-changed", "");
        else this.removeAttribute("data-changed");

        this.innerHTML = `
            <li>${this.anchor.range.quote.exact}</li>
        `;
    }

    toggleFocus(focus: boolean): void {
        return;
    }

    toggleHover(hover: boolean): void {
        return;
    }

    destroy(): void {
        this.remove();
    }
}
