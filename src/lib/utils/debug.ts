export function checkBrowserSupport(): { supported: boolean; missing: string[]; warnings: string[] } {
    const missing: string[] = [];
    const warnings: string[] = [];

    // Check required APIs
    if (!window.getSelection) missing.push("Selection API");
    if (!document.evaluate) missing.push("XPath API");
    if (!Range.prototype.surroundContents) missing.push("Range API");
    if (!document.createTreeWalker) missing.push("TreeWalker API");
    if (!customElements) missing.push("Custom Elements API");

    return {
        supported: missing.length === 0,
        missing,
        warnings,
    };
}

export function debugNode(node: Node, label?: string): void {
    if (typeof console === "undefined" || !console.group) return;

    const prefix = label ? `${label}: ` : "";
    console.group(`${prefix}Node Debug`);
    console.log("Type:", node.nodeType);
    console.log("Name:", node.nodeName);
    console.log("Value:", node.nodeValue);
    console.log("Text Content:", node.textContent);
    console.log("Parent:", node.parentNode?.nodeName);
    console.log("Children:", node.childNodes.length);
    console.log("Node:", node);
    console.groupEnd();
}

export function debugRange(range: Range, label?: string): void {
    if (typeof console === "undefined" || !console.group) return;

    const prefix = label ? `${label}: ` : "";
    console.group(`${prefix}Range Debug`);
    console.log("Collapsed:", range.collapsed);
    console.log("Start Container:", range.startContainer.nodeName);
    console.log("Start Offset:", range.startOffset);
    console.log("End Container:", range.endContainer.nodeName);
    console.log("End Offset:", range.endOffset);
    console.log("Common Ancestor:", range.commonAncestorContainer.nodeName);
    console.log("Text:", range.toString());
    console.log("Range:", range);
    console.groupEnd();
}

export function visualizeNodeTree(node: Node, maxDepth: number = 5): string {
    function buildTree(currentNode: Node, depth: number, prefix: string = ""): string {
        if (depth > maxDepth) return prefix + "...\n";

        const indent = "  ".repeat(depth);
        const nodeInfo = currentNode.nodeType === Node.TEXT_NODE ? `"${currentNode.textContent?.slice(0, 20) || ""}${(currentNode.textContent?.length || 0) > 20 ? "..." : ""}"` : currentNode.nodeName;

        let result = `${prefix}${indent}${nodeInfo}\n`;

        if (currentNode.childNodes.length > 0 && depth < maxDepth) {
            Array.from(currentNode.childNodes).forEach((child, index) => {
                const isLast = index === currentNode.childNodes.length - 1;
                const newPrefix = prefix + indent + (isLast ? "└── " : "├── ");
                result += buildTree(child, depth + 1, newPrefix);
            });
        }

        return result;
    }

    return buildTree(node, 0);
}
