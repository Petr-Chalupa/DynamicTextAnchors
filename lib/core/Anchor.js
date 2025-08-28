import { EventBus } from "./EventBus";
import { invertHexColor, isValidHexColor } from "../utils/color";
export class Anchor {
    id;
    fgColor;
    bgColor;
    range;
    changed;
    eventBus = EventBus.getInstance();
    constructor(range) {
        this.id = crypto.randomUUID();
        this.fgColor = "#000000";
        this.bgColor = "#ffff00";
        this.range = range;
        this.changed = false;
        this.eventBus.on("anchor:destroy-request", (event) => {
            if (event.payload.anchor.id === this.id)
                this.destroy();
        }, this);
    }
    setColor(bg, fg) {
        if (!isValidHexColor(bg))
            return;
        this.bgColor = bg;
        this.fgColor = fg && isValidHexColor(fg) ? fg : invertHexColor(bg);
        this.changed = true;
        this.eventBus.emit({ type: "anchor:change", payload: { anchor: this } });
    }
    setRange(range) {
        this.range = range;
        this.changed = true;
        this.eventBus.emit({ type: "anchor:change", payload: { anchor: this } });
    }
    acceptChange() {
        this.changed = false;
        this.eventBus.emit({ type: "anchor:change", payload: { anchor: this } });
    }
    requestFocus(focus) {
        this.eventBus.emit({ type: "anchor:focus-request", payload: { anchor: this, focus } });
    }
    requestMerge(direction) {
        this.eventBus.emit({ type: "anchor:merge-request", payload: { anchor: this, direction } });
    }
    serialize() {
        return {
            id: this.id,
            bgColor: this.bgColor,
            fgColor: this.fgColor,
            range: this.range,
            changed: this.changed,
        };
    }
    static deserialize(data) {
        const anchor = new Anchor(data.range);
        anchor.id = data.id;
        anchor.bgColor = data.bgColor;
        anchor.fgColor = data.fgColor;
        anchor.changed = data.changed;
        return anchor;
    }
    destroy() {
        this.eventBus.emit({ type: "anchor:destroy", payload: { anchor: this } });
        this.eventBus.offAll(this);
    }
}
//# sourceMappingURL=Anchor.js.map