import type { SerializedDTA, DTAInstance, AnchorBlockInstance, AnchorInstance, DTAError, DTAErrorType, DTAConfig, DTAEvents, MergeDirection } from "../types";
import { nodePositionComparator, getNodeFromXPath, getXPathFromNode, getAllTextNodes, getConnectingTextNodes, getSafeSelection } from "../utils/dom";
import { normalizeString } from "../utils/string";
import { splitArrayToChunks } from "../utils/array";
import { isValidHexColor } from "../utils/color";
import { EventEmitter } from "./EventEmitter";
import AnchorBlock from "./AnchorBlock";

export default class DTA extends EventEmitter<DTAEvents> implements DTAInstance {
    #anchorBlocks: AnchorBlockInstance[] = [];
    #config: Readonly<DTAConfig>;

    constructor(config: DTAConfig) {
        super();

        this.#validateConfig(config);

        config.rootNode.normalize();
        this.#config = Object.freeze(config);
    }

    get config(): Readonly<DTAConfig> {
        return this.#config;
    }

    get rootNode(): Element {
        return this.#config.rootNode;
    }

    get anchorBlocks(): readonly AnchorBlockInstance[] {
        return Object.freeze([...this.#anchorBlocks]);
    }

    #validateConfig(config: DTAConfig): void {
        if (!config.rootNode) {
            throw this.createError("CONFIGURATION_ERROR", "Root node is required");
        }
        if (!(config.rootNode instanceof Element)) {
            throw this.createError("CONFIGURATION_ERROR", "rootNode must be an Element");
        }
        if (config.defaultColor && !isValidHexColor(config.defaultColor)) {
            throw this.createError("CONFIGURATION_ERROR", "Invalid default color format");
        }
    }

    createAnchorBlockFromSelection(): AnchorBlockInstance | null {
        const selection = getSafeSelection();
        if (!selection) {
            const error = this.createError("SELECTION_ERROR", "No selection available");
            this.emit("error", { error });
            return null;
        }

        if (!selection.toString().trim()) {
            const error = this.createError("SELECTION_ERROR", "Empty selection");
            this.emit("error", { error });
            return null;
        }

        try {
            const createdBlocks: AnchorBlockInstance[] = [];

            for (let i = 0; i < selection.rangeCount; i++) {
                const range = selection.getRangeAt(i);
                const rangeBlocks = this.#processSelectionRange(range, i);
                createdBlocks.push(...rangeBlocks);
            }

            selection.collapseToEnd();
            this.sort();

            // Emit selection creation event
            this.emit("selection:create", {
                selection,
                anchorBlocks: createdBlocks,
            });

            return createdBlocks[0] || null;
        } catch (error) {
            const dtaError = this.createError("SELECTION_ERROR", "Failed to create anchor blocks from selection", { error });
            this.emit("error", { error: dtaError });
            return null;
        }
    }

    #processSelectionRange(range: Range, rangeIndex: number): AnchorBlockInstance[] {
        const createdBlocks: AnchorBlockInstance[] = [];

        // Validate range container
        let container = range.commonAncestorContainer;
        while (container.nodeType !== Node.ELEMENT_NODE && container.parentNode) {
            container = container.parentNode;
        }

        if (!this.#isValidContainer(container, rangeIndex)) {
            return createdBlocks;
        }

        // Get intersecting text nodes
        const textNodes = this.#getIntersectingTextNodes(range, container);
        if (textNodes.length === 0) return createdBlocks;

        // Process text node chunks
        const chunks = splitArrayToChunks(textNodes, null);
        const ignoreStartOffset = textNodes[0] === null;
        const ignoreEndOffset = textNodes.at(-1) === null;

        chunks.forEach((chunk, chunkIndex) => {
            if (chunk.length === 0) return;

            const anchorBlock = new AnchorBlock(this);
            let hasValidAnchors = false;

            chunk.forEach((textNode, nodeIndex) => {
                if (textNode === null) return;

                const isFirstNode = chunkIndex === 0 && nodeIndex === 0;
                const isLastNode = chunkIndex === chunks.length - 1 && nodeIndex === chunk.length - 1;
                const startOffset = !ignoreStartOffset && isFirstNode ? range.startOffset : 0;
                const endOffset = !ignoreEndOffset && isLastNode ? range.endOffset : textNode.textContent!.length;
                if (anchorBlock.createAnchor(textNode, startOffset, endOffset)) {
                    hasValidAnchors = true;
                }
            });

            if (hasValidAnchors) {
                this.#anchorBlocks.push(anchorBlock);
                createdBlocks.push(anchorBlock);
            }
        });

        return createdBlocks;
    }

    #isValidContainer(container: Node, rangeIndex: number): boolean {
        if (!(container instanceof Element)) return false;

        const isValid = container.isSameNode(this.rootNode) || this.rootNode.contains(container);
        if (!isValid) {
            const error = this.createError("SELECTION_ERROR", `Invalid selection container at range ${rangeIndex}`, { rangeIndex, container: container.nodeName });
            this.emit("error", { error });
        }

        return isValid;
    }

    #getIntersectingTextNodes(range: Range, container: Node): (Node | null)[] {
        return getAllTextNodes(container)
            .filter((node) => range.intersectsNode(node))
            .map((node) => {
                const xPath = getXPathFromNode(this.rootNode, node);
                return /DTA-ANCHOR/gi.test(xPath) ? null : node;
            });
    }

    removeAnchorBlocks(anchorBlocks: readonly AnchorBlockInstance[] = this.#anchorBlocks, destroy: boolean | "remove" = true): void {
        [...anchorBlocks].forEach((anchorBlock) => {
            const index = this.#anchorBlocks.findIndex((block) => block.uuid === anchorBlock.uuid);

            if (index !== -1) {
                this.#anchorBlocks.splice(index, 1);

                if (destroy !== false) {
                    anchorBlock.destroy();
                }
            }
        });

        this.sort();
    }

    getTextNodeContainer(node: Node): AnchorBlockInstance | null {
        for (const anchorBlock of this.#anchorBlocks) {
            for (const anchor of anchorBlock.anchors) {
                if (anchor.firstChild === node) {
                    return anchorBlock;
                }
            }
        }
        return null;
    }

    sort(): void {
        this.#anchorBlocks.sort((a, b) => {
            const aNode = a.anchors.at(-1);
            const bNode = b.anchors[0];
            return aNode && bNode ? nodePositionComparator(aNode, bNode) : 0;
        });
    }

    serialize(): SerializedDTA {
        try {
            return {
                anchorBlocks: this.#anchorBlocks.map((block) => block.serialize()),
                version: "1.0.0",
                metadata: {
                    created: new Date().toISOString(),
                    modified: new Date().toISOString(),
                    anchorBlockCount: this.#anchorBlocks.length,
                    totalAnchors: this.#anchorBlocks.reduce((sum, block) => sum + block.anchors.length, 0),
                },
            };
        } catch (error) {
            const dtaError = this.createError("SERIALIZATION_ERROR", "Failed to serialize DTA data", { error });
            this.emit("error", { error: dtaError });
            throw dtaError;
        }
    }

    deserialize(data: SerializedDTA): void {
        if (!this.#validateSerializedData(data)) {
            const error = this.createError("DESERIALIZATION_ERROR", "Invalid serialized data format");
            this.emit("error", { error });
            throw error;
        }

        try {
            // Clear existing anchor blocks
            this.removeAnchorBlocks();

            const invalidAnchors: { anchorBlockData: any; index: number }[] = [];

            data.anchorBlocks.forEach((anchorBlockData) => {
                this.#deserializeAnchorBlock(anchorBlockData, invalidAnchors);
            });

            this.#handleInvalidAnchors(invalidAnchors);
            this.sort();
        } catch (error) {
            const dtaError = this.createError("DESERIALIZATION_ERROR", "Failed to deserialize DTA data", { error, data });
            this.emit("error", { error: dtaError });
            throw dtaError;
        }
    }

    createError(type: DTAErrorType, message: string, context?: any): DTAError {
        return {
            name: "DTA Error",
            type,
            message,
            context,
            timestamp: new Date(),
        };
    }

    #validateSerializedData(data: any): data is SerializedDTA {
        return Boolean(data && typeof data === "object" && Array.isArray(data.anchorBlocks) && data.anchorBlocks.every((block: any) => AnchorBlock.validateSerializedData(block)));
    }

    #deserializeAnchorBlock(anchorBlockData: any, invalidAnchors: { anchorBlockData: any; index: number }[]): void {
        const { color, data, anchors } = anchorBlockData;
        const anchorBlock = new AnchorBlock(this);

        let hasValidAnchors = false;

        anchors.forEach((anchorData: any, index: number) => {
            const result = this.#createAnchorFromData(anchorBlock, anchorData);

            if (result.success) {
                hasValidAnchors = true;
                if (result.changed) {
                    result.anchor!.setChanged(true);
                }
            } else {
                invalidAnchors.push({ anchorBlockData, index });
            }
        });

        if (hasValidAnchors) {
            anchorBlock.color = color;
            anchorBlock.data = data;
            this.#anchorBlocks.push(anchorBlock);
        }
    }

    #createAnchorFromData(anchorBlock: AnchorBlockInstance, anchorData: any): { success: boolean; anchor?: AnchorInstance; changed?: boolean } {
        const { startOffset, endOffset, xPath, value } = anchorData;

        const node = getNodeFromXPath(this.rootNode, xPath)?.singleNodeValue;
        if (!node) {
            return { success: false };
        }

        const actualValue = node.textContent!.substring(startOffset, endOffset);

        if (value === actualValue) {
            const anchor = anchorBlock.createAnchor(node, startOffset, endOffset);
            return { success: !!anchor, anchor: anchor || undefined };
        }

        if (normalizeString(value) === normalizeString(actualValue)) {
            const anchor = anchorBlock.createAnchor(node, startOffset, endOffset);
            return { success: !!anchor, anchor: anchor || undefined, changed: true };
        }

        return { success: false };
    }

    #handleInvalidAnchors(invalidAnchors: { anchorBlockData: any; index: number }[]): void {
        invalidAnchors.forEach(({ anchorBlockData, index }) => {
            const result = this.#attemptAnchorRecovery(anchorBlockData, index);

            if (result.success && result.anchorBlock) {
                this.#anchorBlocks.push(result.anchorBlock);
                this.#attemptReconnection(result.anchorBlock, result.anchor!, anchorBlockData, index);
            }
        });
    }

    #attemptAnchorRecovery(anchorBlockData: any, index: number): { success: boolean; anchorBlock?: AnchorBlockInstance; anchor?: AnchorInstance } {
        const { startOffset, value } = anchorBlockData.anchors[index];
        const anchorBlock = new AnchorBlock(this);

        // Search for similar text content
        const searchXPath = `//text()[contains(translate(., "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz"), "${value.toLowerCase()}")]`;

        const occurrences = getNodeFromXPath(this.rootNode, searchXPath, XPathResult.ORDERED_NODE_ITERATOR_TYPE);
        if (!occurrences) return { success: false };

        const validTextNodes = this.#getValidTextNodes(occurrences);
        if (validTextNodes.length === 0) return { success: false };

        // Find best text match
        if (!validTextNodes[0].textContent) return { success: false };

        const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, "\\// ... (rest of deserialization methods remain similar but with better error handling)");
        const matches = [...validTextNodes[0].textContent.matchAll(new RegExp(escapedValue, "gi"))];
        if (matches.length === 0) return { success: false };

        const closestMatch = matches.reduce((closest, current) => {
            const currentDistance = Math.abs(current.index! - startOffset);
            const closestDistance = Math.abs(closest.index! - startOffset);
            return currentDistance < closestDistance ? current : closest;
        });
        const bestMatch = { node: validTextNodes[0], startOffset: closestMatch.index!, endOffset: closestMatch.index! + value.length };
        if (!bestMatch) return { success: false };

        // Create anchor
        const anchor = anchorBlock.createAnchor(bestMatch.node, bestMatch.startOffset, bestMatch.endOffset);
        if (!anchor) return { success: false };

        anchor.setChanged(true);
        anchorBlock.color = anchorBlockData.color;
        anchorBlock.data = anchorBlockData.data;

        return { success: true, anchorBlock, anchor };
    }

    #getValidTextNodes(occurrences: XPathResult): Node[] {
        const textNodes: Node[] = [];
        let occurrence: Node | null = null;

        while ((occurrence = occurrences.iterateNext())) {
            const xpath = getXPathFromNode(this.rootNode, occurrence);
            if (!/DTA-ANCHOR/i.test(xpath)) {
                textNodes.push(occurrence);
            }
        }

        return textNodes;
    }

    #attemptReconnection(anchorBlock: AnchorBlockInstance, anchor: AnchorInstance, anchorBlockData: any, index: number): void {
        this.sort();

        if (!anchor.firstChild) return;

        const connectingTextNodes = getConnectingTextNodes(this.rootNode, anchor.firstChild);

        // Attempt left reconnection
        this.#tryReconnectDirection(anchorBlock, connectingTextNodes.left, anchorBlockData.anchors[index - 1], "left");

        // Attempt right reconnection
        this.#tryReconnectDirection(anchorBlock, connectingTextNodes.right, anchorBlockData.anchors[index + 1], "right");
    }

    #tryReconnectDirection(anchorBlock: AnchorBlockInstance, connectingNode: Node | null, expectedAnchorData: any, direction: MergeDirection): void {
        if (!expectedAnchorData || !connectingNode) return;

        const connectingAnchorBlock = this.getTextNodeContainer(connectingNode);
        if (!connectingAnchorBlock) return;

        const normalizedExpected = normalizeString(expectedAnchorData.value);
        const normalizedActual = normalizeString(connectingNode.textContent!);

        if (normalizedExpected === normalizedActual) {
            anchorBlock.merge(direction);
        }
    }
}
