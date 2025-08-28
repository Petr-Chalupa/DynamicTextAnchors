import { AnchorI, RendererI, AnchorElementI } from "../types";
export declare abstract class Renderer implements RendererI {
    root: HTMLElement;
    renderedAnchors: Map<string, AnchorElementI[]>;
    interactive: boolean;
    eventBus: import("../types").EventBusI;
    constructor(root: HTMLElement);
    abstract renderAnchor(anchor: AnchorI): void;
    updateAnchor(anchor: AnchorI): void;
    removeAnchor(anchor: AnchorI): void;
    focusAnchor(anchor: AnchorI, focus: boolean): void;
    hoverAnchor(anchor: AnchorI, hover: boolean): void;
    destroy(): void;
}
//# sourceMappingURL=Renderer.d.ts.map