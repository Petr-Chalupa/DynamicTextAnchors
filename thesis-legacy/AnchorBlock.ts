import Anchor, { SerializedAnchor } from "./Anchor";
import DTA from "./index";
import { nodePositionComparator, isValidHexColor, getConnectingTextNodes } from "./utils";

type AnchorBlockData = { [key: string]: any };
export type SerializedAnchorBlock = {
    value: string;
    color: string;
    data: object;
    anchors: SerializedAnchor[];
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

        const anchor = new Anchor(this);
        anchor.color(this.#color);

        const range = new Range();
        range.setStart(node, startOffset);
        range.setEnd(node, endOffset);
        range.surroundContents(anchor);

        this.#anchors.push(anchor);
        this.joinAnchors();
        return anchor;
    }

    joinAnchors() {
        // sort Anchors by position in document
        this.#anchors.sort(nodePositionComparator);

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
            // join Anchors internally, set the first focusable
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

    removeAnchors(anchors: Anchor[] = [...this.#anchors], destroy: boolean | "remove" = true) {
        anchors.forEach((anchor) => {
            const anchorIndex = this.#anchors.findIndex(({ uuid }) => uuid === anchor.uuid);
            this.#anchors.splice(anchorIndex, 1);
            if (destroy === true) anchor.destroy();
            else if (destroy === "remove") anchor.remove();
        });
        this.joinAnchors();
    }

    setFocused(focused: boolean, anchors: Anchor[] = this.#anchors) {
        anchors.forEach((anchor) => anchor.setFocused(focused));
    }

    canMerge(to: "left" | "right") {
        const connectingTextNodes = getConnectingTextNodes(this.#dta.rootNode, to === "left" ? this.#anchors[0].firstChild : this.#anchors.at(-1).firstChild);
        const connectingTextNode = connectingTextNodes[to];
        if (!connectingTextNode) return null;

        const connectingAnchorBlock = this.#dta.getTextNodeContainer(connectingTextNode);
        if (!connectingAnchorBlock) return null;

        return connectingAnchorBlock;
    }

    merge(to: "left" | "right") {
        const connectingAnchorBlock = this.canMerge(to);
        if (!connectingAnchorBlock) return;

        const mergeAnchors = to === "left" ? [...connectingAnchorBlock.anchors].reverse() : [...connectingAnchorBlock.anchors];
        mergeAnchors.forEach((anchor) => {
            if (to === "left") this.#anchors.unshift(anchor);
            if (to === "right") this.#anchors.push(anchor);
            anchor.anchorBlock = this;
            anchor.color(this.#color);
        });

        // data merging; data of connectingAnchorBlock may be overwritten
        this.data = { ...connectingAnchorBlock.data, ...this.#data };

        this.#dta.removeAnchorBlocks([connectingAnchorBlock]);
        this.joinAnchors();
        this.setFocused(true);
    }

    serialize() {
        const serializedData: SerializedAnchorBlock = {
            value: this.value,
            color: this.#color,
            data: this.#data,
            anchors: this.#anchors.map((anchor) => anchor.serialize()),
        };
        return serializedData;
    }
}
