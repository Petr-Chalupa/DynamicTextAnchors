export function getPathFromEl(rootNode: Element, el: Node) {
    const elPath = [el];
    let parent = el.parentNode;
    while (parent != null && parent != rootNode) {
        elPath.push(parent);
        parent = parent.parentNode;
    }

    let xPath = ".";
    elPath.reverse().forEach((node: Element, index) => {
        if (node.nodeType === node.ELEMENT_NODE) {
            let nodePosition = 1; // in xPath the frist element has index 1
            const nodeSiblings = index > 0 ? elPath[index - 1].childNodes : rootNode.childNodes;
            for (let i = 0; i < nodeSiblings.length; i++) {
                if (nodeSiblings[i].isSameNode(node)) break;
                else if (nodeSiblings[i].nodeName === node.nodeName) nodePosition++;
            }

            const id = node.ELEMENT_NODE ? node.id : null;

            xPath += `/${node.nodeName}[${nodePosition}]${id ? `[@id="${id}"]` : ""}`;
        } else {
            xPath += "/text()";
        }
    });

    return xPath;
}

export function getElFromPath(rootNode: Element, xPath: string) {
    console.log(rootNode, xPath);
    const result = document.evaluate(xPath, rootNode, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    return result.singleNodeValue;
}
