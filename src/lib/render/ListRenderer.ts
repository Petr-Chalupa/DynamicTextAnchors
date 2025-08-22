import { Renderer } from "./Renderer";
import { AnchorI, AnchorElementI } from "../types";
import { AnchorList } from "../elem/AnchorList";

export class ListRenderer extends Renderer {
    constructor(root: HTMLElement) {
        super(root);
    }

    renderAnchor(anchor: AnchorI): void {
        const existingElements = this.renderedAnchors.get(anchor.id);
        if (existingElements && existingElements.length > 0) {
            this.updateAnchor(anchor);
            return;
        }

        const listAnchor = new AnchorList(anchor);
        this.root.appendChild(listAnchor);
        this.renderedAnchors.set(anchor.id, [listAnchor as AnchorElementI]);
    }
}
