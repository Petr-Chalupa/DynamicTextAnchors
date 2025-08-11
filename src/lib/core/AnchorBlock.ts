import type { AnchorBlockData, SerializedAnchorBlock, AnchorBlockInstance, AnchorInstance, DTAInstance, MergeDirection, ColorValue, DTAEvents } from "../types";
import { DTA_CONSTANTS } from "../types";
import { isValidHexColor } from "../utils/color";
import { nodePositionComparator, getConnectingTextNodes } from "../utils/dom";
import { EventEmitter } from "./EventEmitter";
import Anchor from "./Anchor";

export default class AnchorBlock extends EventEmitter<DTAEvents> implements AnchorBlockInstance {
    uuid: string;
    #anchors: AnchorInstance[] = [];
    #dta: DTAInstance;
    #color: ColorValue = DTA_CONSTANTS.DEFAULT_COLOR;
    #data: AnchorBlockData = {};
    #isDestroyed = false;

    constructor(dta: DTAInstance) {
        super();
        this.uuid = crypto.randomUUID();
        this.#dta = dta;

        // Emit creation event
        process.nextTick(() => {
            this.#dta.emit("block:create", { blockId: this.uuid, block: this });
        });
    }

    get value(): string {
        return this.#anchors.reduce((acc, anchor) => acc + anchor.value, "");
    }

    get anchors(): readonly AnchorInstance[] {
        return Object.freeze([...this.#anchors]);
    }

    get dta(): DTAInstance {
        return this.#dta;
    }

    get color(): ColorValue {
        return this.#color;
    }

    set color(color: string) {
        if (!isValidHexColor(color)) {
            console.warn(`Invalid color provided to anchor block: ${color}`);
            return;
        }
        this.#color = color as ColorValue;
        this.#anchors.forEach((anchor) => anchor.color(this.#color));
    }

    get data(): AnchorBlockData {
        return { ...this.#data };
    }

    set data(data: AnchorBlockData) {
        this.#data = { ...data };
    }

    createAnchor(node: Node, startOffset: number, endOffset: number): AnchorInstance | null {
        if (this.#isDestroyed) {
            console.warn("Cannot create anchor: AnchorBlock has been destroyed");
            return null;
        }

        if (!this.#validateAnchorParams(node, startOffset, endOffset)) {
            return null;
        }

        try {
            const anchor = new Anchor(this);
            anchor.color(this.#color);

            const range = new Range();
            range.setStart(node, startOffset);
            range.setEnd(node, endOffset);
            range.surroundContents(anchor);

            this.#anchors.push(anchor);
            this.joinAnchors();

            return anchor;
        } catch (error) {
            console.error("Failed to create anchor:", error);
            this.#dta.emit("error", {
                error: this.#dta.createError("ANCHOR_CREATION_ERROR", "Failed to create anchor", { node, startOffset, endOffset, error }),
            });
            return null;
        }
    }

    #validateAnchorParams(node: Node, startOffset: number, endOffset: number): boolean {
        if (!node?.textContent) {
            console.warn("Invalid node: no text content");
            return false;
        }

        if (startOffset < 0 || endOffset > node.textContent.length || startOffset >= endOffset) {
            console.warn("Invalid offset range:", { startOffset, endOffset, textLength: node.textContent.length });
            return false;
        }

        const textContent = node.textContent.substring(startOffset, endOffset);
        if (!textContent.trim()) {
            console.warn("Cannot create anchor with empty text content");
            return false;
        }

        return true;
    }

    joinAnchors(): void {
        if (this.#anchors.length === 0) return;

        // Sort anchors by document position
        this.#anchors.sort(nodePositionComparator);

        // Merge adjacent anchors and set up joining
        this.#mergeAdjacentAnchors();
        this.#setupAnchorJoining();
    }

    #mergeAdjacentAnchors(): void {
        for (let i = this.#anchors.length - 1; i >= 1; i--) {
            const currentAnchor = this.#anchors[i];
            const prevAnchor = this.#anchors[i - 1];

            if (prevAnchor.nextElementSibling === currentAnchor) {
                prevAnchor.textContent = (prevAnchor.textContent || "") + currentAnchor.value;
                currentAnchor.remove();
                this.#anchors.splice(i, 1);
            }
        }
    }

    #setupAnchorJoining(): void {
        this.#anchors.forEach((anchor, index) => {
            // Reset joins
            anchor.leftJoin = null;
            anchor.rightJoin = null;

            // Set up navigation and accessibility
            if (index === 0) {
                anchor.tabIndex = 0;
                anchor.ariaLabel = this.value;
            } else {
                anchor.tabIndex = -1;
                anchor.removeAttribute("aria-label");
                anchor.leftJoin = this.#anchors[index - 1];
                this.#anchors[index - 1].rightJoin = anchor;
            }
        });
    }

    removeAnchors(anchors: readonly AnchorInstance[] = this.#anchors, destroy: boolean | "remove" = true): void {
        [...anchors].forEach((anchor) => {
            const anchorIndex = this.#anchors.findIndex((a) => a.uuid === anchor.uuid);
            if (anchorIndex !== -1) {
                this.#anchors.splice(anchorIndex, 1);

                if (destroy === true) {
                    anchor.destroy();
                } else if (destroy === "remove") {
                    anchor.remove();
                }
            }
        });

        if (this.#anchors.length > 0) {
            this.joinAnchors();
        }
    }

    setFocused(focused: boolean, anchors: readonly AnchorInstance[] = this.#anchors): void {
        [...anchors].forEach((anchor) => anchor.setFocused(focused));
    }

    canMerge(to: MergeDirection): AnchorBlockInstance | null {
        if (this.#isDestroyed || this.#anchors.length === 0) return null;

        const targetAnchor = to === "left" ? this.#anchors[0] : this.#anchors.at(-1);
        if (!targetAnchor?.firstChild) return null;

        try {
            const connectingTextNodes = getConnectingTextNodes(this.#dta.rootNode, targetAnchor.firstChild);
            const connectingTextNode = connectingTextNodes[to];

            return connectingTextNode ? this.#dta.getTextNodeContainer(connectingTextNode) : null;
        } catch (error) {
            console.error("Error checking merge capability:", error);
            return null;
        }
    }

    merge(to: MergeDirection): void {
        if (this.#isDestroyed) {
            console.warn("Cannot merge: AnchorBlock has been destroyed");
            return;
        }

        const connectingAnchorBlock = this.canMerge(to);
        if (!connectingAnchorBlock) {
            console.warn(`Cannot merge ${to}: no connecting anchor block found`);
            return;
        }

        try {
            const mergeAnchors = to === "left" ? [...connectingAnchorBlock.anchors].reverse() : [...connectingAnchorBlock.anchors];

            // Transfer anchors
            mergeAnchors.forEach((anchor) => {
                if (to === "left") {
                    this.#anchors.unshift(anchor);
                } else {
                    this.#anchors.push(anchor);
                }
                anchor.anchorBlock = this;
                anchor.color(this.#color);
            });

            // Merge data (current block data takes precedence)
            this.data = { ...connectingAnchorBlock.data, ...this.#data };

            // Emit merge event before removing the connecting block
            this.#dta.emit("block:merge", {
                fromBlockId: connectingAnchorBlock.uuid,
                toBlockId: this.uuid,
                fromBlock: connectingAnchorBlock,
                toBlock: this,
            });

            // Remove the connected block and finalize merge
            this.#dta.removeAnchorBlocks([connectingAnchorBlock]);
            this.joinAnchors();
            this.setFocused(true);
        } catch (error) {
            console.error("Error during merge:", error);
            this.#dta.emit("error", {
                error: this.#dta.createError("DOM_MANIPULATION_ERROR", "Failed to merge anchor blocks", { to, error }),
            });
        }
    }

    destroy(): void {
        if (this.#isDestroyed) return;

        this.#isDestroyed = true;

        // Emit destruction event
        this.#dta.emit("block:destroy", { blockId: this.uuid, block: this });

        // Clean up anchors
        this.removeAnchors(this.#anchors, true);
    }

    serialize(): SerializedAnchorBlock {
        return {
            value: this.value,
            color: this.#color,
            data: this.#data,
            anchors: this.#anchors.map((anchor) => anchor.serialize()),
        };
    }

    static validateSerializedData(data: any): data is SerializedAnchorBlock {
        return Boolean(
            data &&
                typeof data.value === "string" &&
                typeof data.color === "string" &&
                typeof data.data === "object" &&
                Array.isArray(data.anchors) &&
                isValidHexColor(data.color) &&
                data.anchors.every((anchor: any) => Anchor.validateSerializedData(anchor))
        );
    }
}
