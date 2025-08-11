import type { SerializedAnchor, AnchorInstance, AnchorBlockInstance, AnchorKeyboardShortcut, ColorValue, DTAEvents } from "../types";
import { DTA_CONSTANTS } from "../types";
import { invertHexColor, isValidHexColor } from "../utils/color";
import { getXPathFromNode } from "../utils/dom";
import { EventEmitter } from "./EventEmitter";

export default class Anchor extends HTMLElement implements AnchorInstance {
    uuid: string;
    leftJoin: AnchorInstance | null = null;
    rightJoin: AnchorInstance | null = null;
    #anchorBlock: AnchorBlockInstance;
    #currentKeys: string[] = [];
    #isDestroyed = false;

    constructor(anchorBlock: AnchorBlockInstance) {
        super();
        this.uuid = crypto.randomUUID();
        this.#anchorBlock = anchorBlock;
    }

    get anchorBlock(): AnchorBlockInstance {
        return this.#anchorBlock;
    }

    set anchorBlock(newAnchorBlock: AnchorBlockInstance) {
        if (this.#anchorBlock !== newAnchorBlock) {
            this.#anchorBlock.removeAnchors([this], false);
            this.#anchorBlock = newAnchorBlock;
        }
    }

    get startOffset(): number {
        const prevSibling = this.previousSibling;
        return prevSibling?.nodeType === Node.TEXT_NODE ? prevSibling.textContent?.length ?? 0 : 0;
    }

    get endOffset(): number {
        return this.startOffset + this.value.length;
    }

    get value(): string {
        return this.textContent ?? "";
    }

    get xPath(): string {
        if (!this.parentNode) {
            throw new Error("Cannot generate XPath: anchor is not attached to DOM");
        }

        try {
            let nodePosition = this.#calculateTextNodePosition();
            return getXPathFromNode(this.#anchorBlock.dta.rootNode, this.parentNode) + `/text()[${nodePosition}]`;
        } catch (error) {
            console.error("Failed to generate XPath:", error);
            return "";
        }
    }

    #calculateTextNodePosition(): number {
        let nodePosition = 1; // XPath starts from 1
        let prevSibling = this.previousSibling;

        while (prevSibling) {
            if (prevSibling.nodeType === Node.TEXT_NODE) {
                nodePosition++;
            }
            prevSibling = prevSibling.previousSibling;
        }

        return nodePosition;
    }

    connectedCallback(): void {
        if (this.#isDestroyed) return;

        this.parentNode?.normalize();
        this.dataset.uuid = this.uuid;

        this.#setupEventListeners();
        this.#setupKeyboardShortcuts();

        // Emit creation event
        this.#anchorBlock.dta.emit("anchor:create", {
            anchorId: this.uuid,
            blockId: this.#anchorBlock.uuid,
            anchor: this,
        });
    }

    #setupEventListeners(): void {
        this.addEventListener("focusin", this.#handleFocus.bind(this));
        this.addEventListener("focusout", this.#handleBlur.bind(this));
        this.addEventListener("keyup", () => (this.#currentKeys = []));
    }

    #handleFocus(): void {
        this.#anchorBlock.setFocused(true, [this]);
        this.#anchorBlock.dta.emit("anchor:focus", {
            anchorId: this.uuid,
            blockId: this.#anchorBlock.uuid,
            anchor: this,
        });
    }

    #handleBlur(): void {
        this.#anchorBlock.setFocused(false, [this]);
        this.#anchorBlock.dta.emit("anchor:blur", {
            anchorId: this.uuid,
            blockId: this.#anchorBlock.uuid,
            anchor: this,
        });
    }

    #setupKeyboardShortcuts(): void {
        const shortcuts = this.#getKeyboardShortcuts();
        shortcuts.forEach((shortcut) => this.#registerShortcut(shortcut));
    }

    #getKeyboardShortcuts(): AnchorKeyboardShortcut[] {
        return [
            {
                keys: [...DTA_CONSTANTS.KEYBOARD_SHORTCUTS.MERGE_LEFT],
                handler: () => this.#anchorBlock.merge("left"),
                description: "Merge with left anchor block",
            },
            {
                keys: [...DTA_CONSTANTS.KEYBOARD_SHORTCUTS.MERGE_RIGHT],
                handler: () => this.#anchorBlock.merge("right"),
                description: "Merge with right anchor block",
            },
            {
                keys: [...DTA_CONSTANTS.KEYBOARD_SHORTCUTS.DELETE],
                handler: () => this.#anchorBlock.dta.removeAnchorBlocks([this.#anchorBlock]),
                description: "Delete anchor block",
            },
        ];
    }

    #registerShortcut(shortcut: AnchorKeyboardShortcut): void {
        this.addEventListener("keydown", (e: KeyboardEvent) => {
            if (!this.#currentKeys.includes(e.key)) {
                this.#currentKeys.push(e.key);
            }

            const currentKeysSet = new Set(this.#currentKeys);
            const shortcutKeysSet = new Set(shortcut.keys);

            if (this.#setsEqual(currentKeysSet, shortcutKeysSet)) {
                e.preventDefault();
                this.#currentKeys = [];
                shortcut.handler();
            }
        });
    }

    #setsEqual(set1: Set<string>, set2: Set<string>): boolean {
        return set1.size === set2.size && [...set1].every((key) => set2.has(key));
    }

    destroy(): void {
        if (this.#isDestroyed) return;

        this.#isDestroyed = true;

        // Emit destruction event before destroying
        this.#anchorBlock.dta.emit("anchor:destroy", {
            anchorId: this.uuid,
            blockId: this.#anchorBlock.uuid,
            anchor: this,
        });

        const parentNode = this.parentNode;
        if (parentNode) {
            this.replaceWith(document.createTextNode(this.value));
            parentNode.normalize();
        }
    }

    setChanged(changed: boolean): void {
        if (changed) {
            this.setAttribute("data-changed", "true");
            this.#anchorBlock.dta.emit("anchor:change", {
                anchorId: this.uuid,
                blockId: this.#anchorBlock.uuid,
                anchor: this,
            });
        } else {
            this.removeAttribute("data-changed");
        }
    }

    setFocused(focused: boolean): void {
        if (focused) {
            this.setAttribute("data-focused", "true");
            if (this.tabIndex >= 0 && document.activeElement !== this) {
                this.focus();
            }
        } else {
            this.removeAttribute("data-focused");
        }
    }

    color(color: ColorValue): void {
        if (!isValidHexColor(color)) {
            console.warn(`Invalid color provided to anchor: ${color}`);
            return;
        }
        this.style.backgroundColor = color;
        this.style.color = invertHexColor(color);
    }

    serialize(): SerializedAnchor {
        return {
            startOffset: this.startOffset,
            endOffset: this.endOffset,
            xPath: this.xPath,
            value: this.value,
        };
    }

    static validateSerializedData(data: any): data is SerializedAnchor {
        return Boolean(
            data &&
                typeof data.startOffset === "number" &&
                typeof data.endOffset === "number" &&
                typeof data.xPath === "string" &&
                typeof data.value === "string" &&
                data.startOffset >= DTA_CONSTANTS.VALIDATION.MIN_OFFSET &&
                data.endOffset >= data.startOffset &&
                data.xPath.length <= DTA_CONSTANTS.VALIDATION.MAX_XPATH_LENGTH &&
                data.value.length <= DTA_CONSTANTS.VALIDATION.MAX_VALUE_LENGTH
        );
    }
}
