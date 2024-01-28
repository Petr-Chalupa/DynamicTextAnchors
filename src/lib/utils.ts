export function getPathFromNode(rootNode: Element, node: Node) {
    const elPath = [node];
    let parent = node.parentNode;
    while (parent != null && parent != rootNode) {
        elPath.push(parent);
        parent = parent.parentNode;
    }

    let xPath = ".";
    elPath.reverse().forEach((node: Element, index) => {
        let nodePosition = 1; // in xPath the frist element has index 1
        const nodeSiblings = index > 0 ? elPath[index - 1].childNodes : rootNode.childNodes;

        for (let i = 0; i < nodeSiblings.length; i++) {
            if (nodeSiblings[i].isSameNode(node)) break;
            else if (nodeSiblings[i].nodeName === node.nodeName) nodePosition++;
        }
        const id = node.ELEMENT_NODE ? node.id : null;

        if (node.nodeType === node.TEXT_NODE) xPath += `/text()[${nodePosition}]`;
        else xPath += `/${node.nodeName}[${nodePosition}]${id ? `[@id="${id}"]` : ""}`;
    });

    return xPath;
}

export function getNodeFromPath(rootNode: Element, xPath: string, resType: number = XPathResult.FIRST_ORDERED_NODE_TYPE) {
    try {
        const result = document.evaluate(xPath, rootNode, null, resType, null);
        return result;
    } catch (err) {
        return null;
    }
}

export function getAllTextNodes(rootNode: Node) {
    const children: Node[] = [];
    const walker = document.createTreeWalker(rootNode, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) children.push(walker.currentNode);
    return children;
}

export function getConnectingTextNode(rootNode: Element, node: Node, position: "preceding" | "following") {
    try {
        const xPath = getPathFromNode(rootNode, node) + "/" + position + "::*[text()]/text()[1]";
        const result = document.evaluate(xPath, rootNode, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        return result.snapshotItem(position === "preceding" ? result.snapshotLength - 1 : 0);
    } catch (err) {
        return null;
    }
}

export function normalizeString(str: string) {
    return str
        .normalize("NFD")
        .replace(/[\p{Diacritic}.,\/#!$%\^&\*;:{}=\-_`~()]/gu, "")
        .replace(/\s{2,}/g, " ")
        .toLowerCase();
}

export function nodePositionComparator(x: Node, y: Node) {
    const position = x.compareDocumentPosition(y);
    if (position === Node.DOCUMENT_POSITION_FOLLOWING || position === Node.DOCUMENT_POSITION_CONTAINED_BY) return -1;
    else if (position === Node.DOCUMENT_POSITION_PRECEDING || position === Node.DOCUMENT_POSITION_CONTAINS) return 1;
    else return 0;
}

export function splitArrayToChunks(array: any[], del: any) {
    const chunks: any[][] = [[]];
    let chunkIndex = 0;

    array.forEach((item) => {
        if (item != del) {
            if (!chunks[chunkIndex]) chunks[chunkIndex] = [];
            chunks[chunkIndex].push(item);
        } else chunkIndex++;
    });

    return chunks;
}

export function isValidHexColor(hex: string) {
    if (/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(hex)) return true; // f.e. #aa0 or #bc65af
    else {
        console.error(new Error(`Hex color ${hex} is not valid!`));
        return false;
    }
}

export function invertHexColor(hex: string) {
    if (hex.indexOf("#") === 0) hex = hex.slice(1);
    if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]; // convert 3-digit hex to 6-digits

    const r = parseInt(hex.slice(0, 2), 16),
        g = parseInt(hex.slice(2, 4), 16),
        b = parseInt(hex.slice(4, 6), 16);
    return r * 0.299 + g * 0.587 + b * 0.114 >= 150 ? "#000000" : "#FFFFFF";
}
