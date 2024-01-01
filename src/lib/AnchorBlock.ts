import Anchor, { SerializedAnchor } from "./Anchor";
import DTA from "./index";
import { isValidHexColor } from "./utils";

type AnchorBlockData = { [key: string]: any };
export type SerializedAnchorBlock = {
    startAnchor: SerializedAnchor;
    endAnchor: SerializedAnchor;
    value: string;
    color: string;
    data: object;
};

export default class AnchorBlock {
    uuid: string;
    #anchors: Anchor[] = [];
    #dta: DTA;
    #color: string = "#ffff00";
    #data: AnchorBlockData = {};

    constructor(dta: DTA) {
        this.uuid = crypto.randomUUID();
        this.#dta = dta;
    }

    get value() {
        const value = this.#anchors.reduce((acc, curr) => acc + curr.value, "");
        return value;
    }

    get anchors() {
        return this.#anchors;
    }

    get dta() {
        return this.#dta;
    }

    get color() {
        return this.#color;
    }

    set color(color: string) {
        if (!isValidHexColor(color)) return;
        this.#color = color;
        this.#anchors.forEach((anchor) => anchor.color(color));
    }

    get data() {
        return this.#data;
    }

    set data(data: AnchorBlockData) {
        this.#data = data;
    }

    createAnchor(node: Node, startOffset: number, endOffset: number) {
        if (startOffset > node.textContent.length || endOffset > node.textContent.length) return;
        if (node.textContent.substring(startOffset, endOffset + 1).trim().length === 0) return;

        const anchor = new Anchor(this, node, startOffset, endOffset);
        anchor.color(this.#color);
        this.#anchors.push(anchor);
    }

    joinAnchors() {
        for (let i = 1; i < this.#anchors.length; i++) {
            const anchor = this.#anchors[i];
            anchor.leftJoin = this.#anchors[i - 1];
            this.#anchors[i - 1].rightJoin = anchor;
        }
    }

    destroyAnchors(anchors: Anchor[] = [...this.#anchors]) {
        anchors.forEach((anchor) => {
            const anchorIndex = this.#anchors.findIndex(({ uuid }) => uuid === anchor.uuid);
            anchor.destroy();
            this.#anchors.splice(anchorIndex, 1);
        });
    }

    setChanged(changed: boolean, anchors: Anchor[] = this.#anchors) {
        anchors.forEach((anchor) => anchor.setChanged(changed));
    }

    serialize() {
        const serializedData: SerializedAnchorBlock = {
            startAnchor: this.#anchors[0].serialize(),
            endAnchor: this.#anchors.at(-1).serialize(),
            value: this.value,
            color: this.#color,
            data: this.#data,
        };
        return serializedData;
    }
}
