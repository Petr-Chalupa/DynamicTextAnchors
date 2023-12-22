import Anchor, { SerializedAnchor } from "./Anchor";
import { getElFromPath, getPathFromEl } from "./utils";

export interface SerializedAnchorBlock {
    uuid: string;
    anchors: SerializedAnchor[];
    value: string;
    color: string;
    data: object;
}

export default class AnchorBlock {
    rootNode: Element;
    uuid: string;
    anchors: Anchor[] = [];
    #color: string = "#ffff00";
    #data: object = {};

    constructor(rootNode: Element, container?: Node, range?: Range, uuid?: string) {
        uuid ??= crypto.randomUUID();

        this.rootNode = rootNode;
        this.uuid = uuid;

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
            this.createAnchor(node, startOffset, endOffset);
        });

        this.#joinAnchors();
        range.collapse();
    }

    get value() {
        const value = this.anchors.reduce((acc, curr) => acc + curr.value, "");
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

    createAnchor(node: Node, startOffset: number, endOffset: number, uuid?: string, xPath?: string) {
        xPath ??= getPathFromEl(this.rootNode, node);
        if (/DTA-ANCHOR/gi.test(xPath)) return; // overlap

        const anchor = new Anchor(this, node, startOffset, endOffset, uuid, xPath);
        anchor.color(this.#color);
        this.anchors.push(anchor);
    }

    #joinAnchors() {
        // this.anchors[0].focusable = true;
        for (let i = 1; i < this.anchors.length; i++) {
            const anchor = this.anchors[i];
            anchor.leftJoin = this.anchors[i - 1];
            this.anchors[i - 1].rightJoin = anchor;
            // anchor.focusable = false;
        }
    }

    // destroyAnchor(uuid: string) {
    //     const index = this.anchors.findIndex((anchor) => anchor.uuid === uuid);
    //     this.anchors[index]?.destroy();
    //     this.anchors.splice(index, 1);
    // }

    destroyAnchors() {
        this.anchors.forEach((anchor) => anchor.destroy());
        this.anchors = [];
    }

    serialize() {
        const serializedData: SerializedAnchorBlock = {
            uuid: this.uuid,
            anchors: this.anchors.map((anchor) => anchor.serialize()),
            value: this.value,
            color: this.#color,
            data: this.#data,
        };
        return serializedData;
    }

    // deserialize(data: SerializedAnchorBlock) {
    //     this.#color = data.color;
    //     this.#data = data.data;
    //     data.anchors.forEach((anchorData) => {
    //         const { uuid, startOffset, endOffset, xPath } = anchorData;
    //         const node = getElFromPath(this.rootNode, xPath);
    //         this.createAnchor(node, startOffset, endOffset, uuid, xPath);
    //     });
    //     this.#joinAnchors();
    // }
}
