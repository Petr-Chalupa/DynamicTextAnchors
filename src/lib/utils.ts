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

        if (node.nodeType === node.ELEMENT_NODE) {
            xPath += `/${node.nodeName}[${nodePosition}]${id ? `[@id="${id}"]` : ""}`;
        } else {
            xPath += `/text()[${nodePosition}]`;
        }
    });

    return xPath;
}

export function getNodeFromPath(rootNode: Element, xPath: string) {
    try {
        const result = document.evaluate(xPath, rootNode, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        return result.singleNodeValue;
    } catch (err) {
        return null;
    }
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
