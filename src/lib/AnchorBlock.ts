import Anchor, { SerializedAnchor } from "./Anchor";

export interface SerializedAnchorBlock {
    anchors: SerializedAnchor[];
    value: string;
    color: string;
    data: object;
    // xPath: string;
}

export default class AnchorBlock {
    rootNode: Element;
    anchors: Anchor[] = [];
    #color: string = "#ffff00";
    #data: object = {};
    // #container: Node;
    // #xPath: string;

    constructor(rootNode: Element, container?: Node, range?: Range) {
        this.rootNode = rootNode;

        if (!container || !range) return;
        // this.#container = container;
        // this.#xPath = getPathFromEl(rootNode, container);

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

            const anchor = new Anchor(rootNode, node, startOffset, endOffset);
            if (index > 0) {
                anchor.leftJoin = this.anchors[index - 1];
                this.anchors[index - 1].rightJoin = anchor;
            }
            anchor.color(this.#color);
            this.anchors.push(anchor);
        });

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
        data.anchors.forEach((anchorData, index) => {
            const anchor = new Anchor(this.rootNode, null, anchorData.startOffset, anchorData.endOffset, anchorData.uuid);
            anchor.deserialize(anchorData);
            if (index > 0) {
                anchor.leftJoin = this.anchors[index - 1];
                this.anchors[index - 1].rightJoin = anchor;
            }
            anchor.color(this.#color);
            this.anchors.push(anchor);
        });
        // this.#value = data.value; //check if the saved value is the same
        // this.#xPath = data.xPath;
        // this.#container = data.container;
    }
}
