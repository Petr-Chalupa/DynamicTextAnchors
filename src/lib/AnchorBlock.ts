import Anchor, { SerializedAnchor } from "./Anchor";
import { getElFromPath, getPathFromEl } from "./utils";

export interface SerializedAnchorBlock {
    anchors: SerializedAnchor[];
    value: string;
    color: string;
    data: object;
}

export default class AnchorBlock {
    rootNode: Element;
    anchors: Anchor[] = [];
    #color: string = "#ffff00";
    #data: object = {};

    constructor(rootNode: Element, container?: Node, range?: Range) {
        this.rootNode = rootNode;

        if (!container || !range) return;

        const intersectingTextNodes: Node[] = [];
        (function traverse(node: Node) {
            if (!range.intersectsNode(node)) return;
            if (node.nodeType === Node.ELEMENT_NODE) {
                for (const child of node.childNodes) traverse(child);
            } else if (node.nodeType === Node.TEXT_NODE) {
                intersectingTextNodes.push(node);
            }
        })(container);

        intersectingTextNodes.forEach((node, index) => {
            const startOffset = index === 0 ? range.startOffset : 0;
            const endOffset = index === intersectingTextNodes.length - 1 ? range.endOffset : node.textContent.length;
            this.#createAnchor(node, startOffset, endOffset);
        });

        this.#joinAnchors();
        range.collapse();
    }

    get value() {
        let value = "";
        this.anchors.forEach((anchor) => {
            value += anchor.value;
        });
        return value;
    }

    get color() {
        return this.#color;
    }

    set color(color: string) {
        if (!/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(color)) return; // f.e. #aa0 or #bc65af
        this.#color = color;
        this.anchors.forEach((anchor) => anchor.color(this.#color));
    }

    get data() {
        return this.#data;
    }

    set data(data: object) {
        this.#data = data;
    }

    #createAnchor(node: Node, startOffset: number, endOffset: number, uuid?: string, xPath?: string) {
        xPath ??= getPathFromEl(this.rootNode, node);
        if (/DTA-ANCHOR/gi.test(xPath)) return; // overlap

        const anchor = new Anchor(this.rootNode, node, startOffset, endOffset, uuid, xPath);
        anchor.color(this.#color);
        this.anchors.push(anchor);
    }

    #joinAnchors() {
        for (let i = 1; i < this.anchors.length; i++) {
            const anchor = this.anchors[i];
            anchor.leftJoin = this.anchors[i - 1];
            this.anchors[i - 1].rightJoin = anchor;
        }
    }

    serialize() {
        const serializedData: SerializedAnchorBlock = {
            anchors: this.anchors.map((anchor) => anchor.serialize()),
            value: this.value,
            color: this.#color,
            data: this.#data,
        };
        return serializedData;
    }

    deserialize(data: SerializedAnchorBlock) {
        this.#color = data.color;
        this.#data = data.data;
        data.anchors.forEach((anchorData) => {
            this.#createAnchor(getElFromPath(this.rootNode, anchorData.xPath), anchorData.startOffset, anchorData.endOffset, anchorData.uuid, anchorData.xPath);
        });
        this.#joinAnchors();
    }
}
