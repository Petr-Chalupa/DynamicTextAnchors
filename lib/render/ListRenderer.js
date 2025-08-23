import { Renderer } from "./Renderer";
import { AnchorList } from "../elem/AnchorList";
export class ListRenderer extends Renderer {
    constructor(root) {
        super(root);
    }
    renderAnchor(anchor) {
        const existingElements = this.renderedAnchors.get(anchor.id);
        if (existingElements && existingElements.length > 0) {
            this.updateAnchor(anchor);
            return;
        }
        const listAnchor = new AnchorList(anchor);
        this.root.appendChild(listAnchor);
        this.renderedAnchors.set(anchor.id, [listAnchor]);
    }
}
//# sourceMappingURL=ListRenderer.js.map