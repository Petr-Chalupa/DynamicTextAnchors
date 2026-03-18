import { AnchorElement } from "./AnchorElement";
import { AnchorI } from "../types";

export class AnchorList extends AnchorElement {
    constructor(anchor: AnchorI) {
        super(anchor);
    }

    render(): void {
        super.render();

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
