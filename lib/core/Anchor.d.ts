import { AnchorI, ColorValue, DTARange, MergeDirection, SerializedAnchor } from "../types";
export declare class Anchor implements AnchorI {
    id: string;
    fgColor: ColorValue;
    bgColor: ColorValue;
    range: DTARange;
    changed: boolean;
    eventBus: import("../types").EventBusI;
    constructor(range: DTARange);
    setColor(bg: ColorValue, fg?: ColorValue): void;
    setRange(range: DTARange): void;
    acceptChange(): void;
    requestFocus(focus: boolean): void;
    requestMerge(direction: MergeDirection): void;
    serialize(): SerializedAnchor;
    static deserialize(data: SerializedAnchor): Anchor;
    destroy(): void;
}
//# sourceMappingURL=Anchor.d.ts.map