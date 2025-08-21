import { AnchorI } from "../core/types";
import { AnchorInline } from "../elem/AnchorInline";
import { EventBusI } from "../events/types";

export interface RendererI {
    readonly root: HTMLElement;
    readonly renderedAnchors: Map<string, AnchorInline[]>;
    readonly interactive: boolean;
    readonly eventBus: EventBusI;

    renderAnchor(anchor: AnchorI): void;
    updateAnchor(anchor: AnchorI): void;
    removeAnchor(anchor: AnchorI): void;
    focusAnchor(anchor: AnchorI, focus: boolean): void;
    hoverAnchor(anchor: AnchorI, hover: boolean): void;
    destroy(): void;
}
