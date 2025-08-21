import { EventBus } from "../events/EventBus";
import { invertHexColor, isValidHexColor, rgbToHex } from "../utils/color";
import { AnchorI, ColorValue, DTARange, MergeDirection } from "./types";

export class Anchor implements AnchorI {
    id: string;
    fgColor: ColorValue;
    bgColor: ColorValue;
    range: DTARange;
    eventBus = EventBus.getInstance();

    constructor(range: DTARange) {
        this.id = crypto.randomUUID();
        this.fgColor = "#000000";
        this.bgColor = "#ffff00";
        this.range = range;

        this.eventBus.on(
            "anchor:destroy-request",
            (event) => {
                if (event.payload.anchor.id === this.id) this.destroy();
            },
            this
        );
    }

    setColor(bg: ColorValue, fg?: ColorValue): void {
        if (!isValidHexColor(bg)) return;

        this.bgColor = bg;
        this.fgColor = fg && isValidHexColor(fg) ? fg : invertHexColor(bg);
        this.eventBus.emit({ type: "anchor:change", payload: { anchor: this } });
    }

    setRange(range: DTARange): void {
        this.range = range;
        this.eventBus.emit({ type: "anchor:change", payload: { anchor: this } });
    }

    requestMerge(direction: MergeDirection) {
        this.eventBus.emit({ type: "anchor:merge-request", payload: { anchor: this, direction } });
    }

    destroy(): void {
        this.eventBus.emit({ type: "anchor:destroy", payload: { anchor: this } });
        this.eventBus.offAll(this);
    }
}
