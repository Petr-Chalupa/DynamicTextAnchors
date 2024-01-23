import Anchor, { SerializedAnchor } from "./Anchor";
import DTA from "./index";
import { getConnectingTextNode, isValidHexColor } from "./utils";

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
        for (let i = 0; i < this.#anchors.length; i++) {
            const anchor = this.#anchors[i];
            const prevAnchor = this.#anchors[i - 1];
            const nextAnchor = this.#anchors[i + 1];
            // merge touching sibling Anchors (cleanup)
            if (i < this.anchors.length - 1 && anchor.nextElementSibling === nextAnchor) {
                anchor.textContent += nextAnchor.value;
                nextAnchor.remove();
                this.#anchors.splice(i + 1, 1);
            }
            // join Anchors internally
            if (i === 0) {
                anchor.tabIndex = 0;
                anchor.ariaLabel = this.value;
            } else {
                anchor.tabIndex = -1;
                anchor.removeAttribute("aria-label");
                anchor.leftJoin = prevAnchor;
                prevAnchor.rightJoin = anchor;
            }
        }
    }

    destroyAnchors(anchors: Anchor[] = [...this.#anchors], destroy: boolean = true) {
        anchors.forEach((anchor) => {
            const anchorIndex = this.#anchors.findIndex(({ uuid }) => uuid === anchor.uuid);
            if (destroy) anchor.destroy();
            this.#anchors.splice(anchorIndex, 1);
        });
    }

    setChanged(changed: boolean, anchors: Anchor[] = this.#anchors) {
        anchors.forEach((anchor) => anchor.setChanged(changed));
    }

    setFocused(focused: boolean, anchors: Anchor[] = this.#anchors) {
        anchors.forEach((anchor) => anchor.setFocused(focused));
    }

    merge(to: "left" | "right") {
        let textNode = null;
        if (to === "left") textNode = getConnectingTextNode(this.#dta.rootNode, this.#anchors.at(0), "preceding");
        if (to === "right") textNode = getConnectingTextNode(this.#dta.rootNode, this.#anchors.at(-1), "following");
        if (!textNode) return;
        const containerAnchorBlock = this.#dta.getTextNodeContainer(textNode);
        if (!containerAnchorBlock) return;

        const mergeAnchors = to === "left" ? [...containerAnchorBlock.anchors].reverse() : [...containerAnchorBlock.anchors];
        mergeAnchors.forEach((anchor) => {
            if (to === "left") this.#anchors.unshift(anchor);
            if (to === "right") this.#anchors.push(anchor);
            anchor.anchorBlock = this;
            anchor.color(this.#color);
        });

        // data merging; data of containerAnchorBlock may be overwritten
        this.data = { ...containerAnchorBlock.data, ...this.#data };

        this.joinAnchors();
        this.#dta.removeAnchorBlocks([containerAnchorBlock]);
        this.setFocused(true);
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
