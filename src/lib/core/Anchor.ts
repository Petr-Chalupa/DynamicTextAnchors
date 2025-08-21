import { EventBus } from "./EventBus";
import { AnchorI, ColorValue, DTARange, MergeDirection, SerializedAnchor } from "../types";
import { invertHexColor, isValidHexColor } from "../utils/color";

export class Anchor implements AnchorI {
    id: string;
    fgColor: ColorValue;
    bgColor: ColorValue;
    range: DTARange;
    changed: boolean;
    eventBus = EventBus.getInstance();

    constructor(range: DTARange) {
        this.id = crypto.randomUUID();
        this.fgColor = "#000000";
        this.bgColor = "#ffff00";
        this.range = range;
        this.changed = false;

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
        this.changed = true;
        this.eventBus.emit({ type: "anchor:change", payload: { anchor: this } });
    }

    setRange(range: DTARange): void {
        this.range = range;
        this.changed = true;
        this.eventBus.emit({ type: "anchor:change", payload: { anchor: this } });
    }

    acceptChange(): void {
        this.changed = false;
        this.eventBus.emit({ type: "anchor:change", payload: { anchor: this } });
    }

    requestFocus(focus: boolean): void {
        this.eventBus.emit({ type: "anchor:focus-request", payload: { anchor: this, focus } });
    }

    requestMerge(direction: MergeDirection): void {
        this.eventBus.emit({ type: "anchor:merge-request", payload: { anchor: this, direction } });
    }

    serialize(): SerializedAnchor {
        return {
            id: this.id,
            bgColor: this.bgColor,
            fgColor: this.fgColor,
            range: this.range,
            changed: this.changed,
        } as SerializedAnchor;
    }

    static deserialize(data: SerializedAnchor): Anchor {
        const anchor = new Anchor(data.range);
        anchor.id = data.id;
        anchor.bgColor = data.bgColor;
        anchor.fgColor = data.fgColor;
        anchor.changed = data.changed;
        return anchor;
    }

    destroy(): void {
        this.eventBus.emit({ type: "anchor:destroy", payload: { anchor: this } });
        this.eventBus.offAll(this);
    }
}
