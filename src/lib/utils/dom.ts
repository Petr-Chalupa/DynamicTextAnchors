import { ConnectingTextNodes } from "../types";

export function getXPathFromNode(rootNode: Element, node: Node): string {
    if (!rootNode || !node) throw new Error("Both rootNode and node are required");

    if (!rootNode.contains(node) && !rootNode.isSameNode(node)) throw new Error("Node is not contained within the root node");

    const path: Node[] = [node];
    let parent = node.parentNode;

    // Build path to root
    while (parent && !parent.isSameNode(rootNode)) {
        path.push(parent);
        parent = parent.parentNode;
    }

    if (!parent) throw new Error("Node path does not lead to root node");

    let xPath = ".";

    // Reverse to build path from root to node
    path.reverse().forEach((currentNode, index) => {
        const isElement = currentNode.nodeType === Node.ELEMENT_NODE;
        const isTextNode = currentNode.nodeType === Node.TEXT_NODE;

        if (!isElement && !isTextNode) {
            throw new Error(`Unsupported node type: ${currentNode.nodeType}`);
        }

        let nodePosition = 1; // XPath indexes from 1
        const parentNode = index > 0 ? path[index - 1] : rootNode;
        const siblings = parentNode.childNodes;

        // Calculate position among siblings of same type
        for (let i = 0; i < siblings.length; i++) {
            if (siblings[i].isSameNode(currentNode)) {
                break;
            }
            if (siblings[i].nodeName === currentNode.nodeName) {
                nodePosition++;
            }
        }

        if (isTextNode) {
            xPath += `/text()[${nodePosition}]`;
        } else if (isElement) {
            const element = currentNode as Element;
            const id = element.id ? `[@id="${element.id}"]` : "";
            xPath += `/${element.nodeName}[${nodePosition}]${id}`;
        }
    });

    return xPath;
}

export function isValidXPath(xpath: string): boolean {
    if (typeof xpath !== "string" || xpath.trim().length === 0) return false;

    try {
        const doc = document.implementation.createDocument(null, "root", null);
        document.evaluate(xpath, doc.documentElement, null, XPathResult.ANY_TYPE, null);
        return true;
    } catch (error) {
        return false;
    }
}

export function getNodeFromXPath(rootNode: Element, xPath: string, resultType: number = XPathResult.FIRST_ORDERED_NODE_TYPE): XPathResult | null {
    if (!rootNode || !xPath) {
        console.error("Both rootNode and xPath are required");
        return null;
    }

    if (typeof xPath !== "string" || xPath.trim().length === 0) {
        console.error("XPath must be a non-empty string");
        return null;
    }

    try {
        const result = document.evaluate(xPath, rootNode, null, resultType, null);

        // Validate result type matches expected
        if (result.resultType !== resultType) {
            console.warn(`Expected result type ${resultType}, got ${result.resultType}`);
        }

        return result;
    } catch (error) {
        console.error("XPath evaluation failed:", error);
        return null;
    }
}

export function getAllTextNodes(rootNode: Node, options: { includeEmpty?: boolean; maxDepth?: number; filter?: (node: Node) => boolean } = {}): Node[] {
    if (!rootNode) {
        console.error("Root node is required");
        return [];
    }

    const { includeEmpty = false, maxDepth = Infinity, filter } = options;
    const textNodes: Node[] = [];

    const walker = document.createTreeWalker(rootNode, NodeFilter.SHOW_TEXT, {
        acceptNode: (node: Node): number => {
            // Check depth if specified
            if (maxDepth < Infinity) {
                let depth = 0;
                let parent = node.parentNode;
                while (parent && !parent.isSameNode(rootNode)) {
                    depth++;
                    parent = parent.parentNode;
                }
                if (depth > maxDepth) {
                    return NodeFilter.FILTER_REJECT;
                }
            }

            // Apply custom filter if provided
            if (filter && !filter(node)) {
                return NodeFilter.FILTER_REJECT;
            }

            // Filter empty text nodes unless requested
            if (!includeEmpty && (!node.textContent || node.textContent.trim().length === 0)) {
                return NodeFilter.FILTER_REJECT;
            }

            return NodeFilter.FILTER_ACCEPT;
        },
    });

    let currentNode = walker.nextNode();
    while (currentNode) {
        textNodes.push(currentNode);
        currentNode = walker.nextNode();
    }

    return textNodes;
}

export function getConnectingTextNodes(rootNode: Node, boundaryTextNode: Node, options: { includeEmpty?: boolean } = {}): ConnectingTextNodes {
    if (!rootNode || !boundaryTextNode) throw new Error("Both rootNode and boundaryTextNode are required");

    const { includeEmpty = false } = options;

    try {
        const textNodes = getAllTextNodes(rootNode, {
            includeEmpty,
            filter: (node) => node.textContent !== null && node.textContent?.trim().length > 0,
        });

        const boundaryIndex = textNodes.findIndex((node) => node.isSameNode(boundaryTextNode));

        if (boundaryIndex === -1) {
            console.warn("Boundary text node not found in root node");
            return { left: null, right: null };
        }

        return {
            left: boundaryIndex > 0 ? textNodes[boundaryIndex - 1] : null,
            right: boundaryIndex < textNodes.length - 1 ? textNodes[boundaryIndex + 1] : null,
        };
    } catch (error) {
        console.error("Error getting connecting text nodes:", error);
        return { left: null, right: null };
    }
}

export function isValidTextOffset(offset: number, textLength: number): boolean {
    return !Number.isInteger(offset) || offset < 0 ? false : offset <= textLength;
}

export function isValidOffsetRange(startOffset: number, endOffset: number, textLength: number): boolean {
    return isValidTextOffset(startOffset, textLength) && isValidTextOffset(endOffset, textLength) && startOffset <= endOffset;
}

export function nodePositionComparator(nodeA: Node, nodeB: Node): number {
    if (!nodeA || !nodeB) throw new Error("Both nodes are required for comparison");

    if (nodeA.isSameNode(nodeB)) return 0;

    try {
        const position = nodeA.compareDocumentPosition(nodeB);

        if (position & Node.DOCUMENT_POSITION_FOLLOWING || position & Node.DOCUMENT_POSITION_CONTAINED_BY) {
            return -1;
        } else if (position & Node.DOCUMENT_POSITION_PRECEDING || position & Node.DOCUMENT_POSITION_CONTAINS) {
            return 1;
        }

        return 0;
    } catch (error) {
        console.error("Error comparing node positions:", error);
        return 0;
    }
}

export function sortNodesByPosition(nodes: Node[]): Node[] {
    if (!Array.isArray(nodes)) throw new Error("Input must be an array of nodes");

    return [...nodes].sort(nodePositionComparator);
}

// =============================================================================
// DOM SAFETY
// =============================================================================

export function safeGetTextContent(node: Node | null | undefined): string {
    if (!node) return "";
    return node.textContent || "";
}

export function safeGetNodeValue(node: Node | null | undefined): string {
    if (!node) return "";

    if (node.nodeType === Node.TEXT_NODE) return node.nodeValue || "";
    else return node.textContent || "";
}

export function isSafeToRemove(node: Node): boolean {
    if (!node || !node.parentNode) return false;

    const criticalElements = ["html", "head", "body", "script", "style"];
    const nodeName = node.nodeName.toLowerCase();

    return !criticalElements.includes(nodeName);
}

export function safeRemoveNode(node: Node): boolean {
    if (!isSafeToRemove(node)) {
        console.warn("Attempted to remove critical DOM element:", node.nodeName);
        return false;
    }

    try {
        const parent = node.parentNode;
        if (parent) {
            parent.removeChild(node);
            parent.normalize(); // Clean up adjacent text nodes
            return true;
        }
        return false;
    } catch (error) {
        console.error("Failed to remove node:", error);
        return false;
    }
}

// =============================================================================
// RANGE AND SELECTION
// =============================================================================

export function createSafeRange(startNode: Node, startOffset: number, endNode: Node, endOffset: number): Range | null {
    try {
        const range = new Range();

        if (!isValidTextOffset(startOffset, safeGetTextContent(startNode).length)) {
            console.warn("Invalid start offset:", startOffset);
            return null;
        }
        if (!isValidTextOffset(endOffset, safeGetTextContent(endNode).length)) {
            console.warn("Invalid end offset:", endOffset);
            return null;
        }

        range.setStart(startNode, startOffset);
        range.setEnd(endNode, endOffset);

        return range;
    } catch (error) {
        console.error("Failed to create range:", error);
        return null;
    }
}

export function getSafeSelection(): Selection | null {
    try {
        const selection = window.getSelection();
        return selection && selection.rangeCount > 0 ? selection : null;
    } catch (error) {
        console.error("Failed to get selection:", error);
        return null;
    }
}

export function isSelectionInContainer(selection: Selection, container: Element): boolean {
    if (!selection || selection.rangeCount === 0) return false;

    try {
        for (let i = 0; i < selection.rangeCount; i++) {
            const range = selection.getRangeAt(i);
            const commonAncestor = range.commonAncestorContainer;

            const ancestorElement = commonAncestor.nodeType === Node.ELEMENT_NODE ? (commonAncestor as Element) : commonAncestor.parentElement;

            if (!ancestorElement || (!container.contains(ancestorElement) && !container.isSameNode(ancestorElement))) {
                return false;
            }
        }
        return true;
    } catch (error) {
        console.error("Error checking selection container:", error);
        return false;
    }
}
