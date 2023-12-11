import Anchor from "./Anchor";
import { getElFromPath, getPathFromEl } from "./utils";

export interface Props {
    color: string;
    data: object;
}

export default class AnchorBlock {
    anchors: Anchor[] = [];
    // #value: string = "";
    props: Props = { color: "#ffff00", data: {} };
    // #container: Node;
    rootNode: Element;
    #xPath: string;

    constructor(rootNode: Element, container?: Node, range?: Range) {
        this.rootNode = rootNode;

        if (!container || !range) return;
        // this.#container = container;
        this.#xPath = getPathFromEl(rootNode, container);

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

    serialize() {
        //get path to container
        return {
            anchors: this.anchors.map((anchor) => anchor.serialize()),
            value: this.value,
            props: this.props,
            // container: this.#container,
            xPath: this.#xPath,
        };
    }

    deserialize(data: { anchors: { xPath: string; startOffset: number; endOffset: number; uuid: string }[]; value: string; props: Props; xPath: string }) {
        data.anchors.forEach((anchorData, index) => {
            const anchor = new Anchor(this.rootNode, null, anchorData.startOffset, anchorData.endOffset, anchorData.uuid);
            anchor.deserialize(anchorData);
            if (index > 0) {
                anchor.leftJoin = this.anchors[index - 1];
                this.anchors[index - 1].rightJoin = anchor;
            }
            this.anchors.push(anchor);
        });
        // this.#value = data.value;
        this.props = data.props;
        this.#xPath = data.xPath;
        //get container from path
        // this.#container = data.container;
    }
}
