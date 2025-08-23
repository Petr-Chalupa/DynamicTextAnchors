import { AnchorI, MergeDirection, AnchorElementI } from "../types";
export declare abstract class AnchorElement extends HTMLElement implements AnchorElementI {
    anchor: AnchorI;
    eventBus: import("../types").EventBusI;
    constructor(anchor: AnchorI);
    connectedCallback(): void;
    abstract render(): void;
    requestFocus(focus: boolean): void;
    requestHover(hover: boolean): void;
    requestMerge(direction: MergeDirection): void;
    requestDestroy(): void;
    abstract toggleFocus(focus: boolean): void;
    abstract toggleHover(hover: boolean): void;
    abstract destroy(): void;
}
//# sourceMappingURL=AnchorElement.d.ts.map