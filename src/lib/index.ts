// =========================================================
// DYNAMIC TEXT ANCHORS LIBRARY - Main Entry Point
// =========================================================

export * from "./types";

export { DTA } from "./core/DTA";
export { Anchor } from "./core/Anchor";
export { EventBus } from "./core/EventBus";

import { AnchorInline } from "./elem/AnchorInline";
import { AnchorList } from "./elem/AnchorList";
import { InlineRenderer } from "./render/InlineRenderer";
import { ListRenderer } from "./render/ListRenderer";
export { AnchorInline, AnchorList };
export { InlineRenderer, ListRenderer };

// Register custom elements
customElements.define("dta-anchor-inline", AnchorInline);
customElements.define("dta-anchor-list", AnchorList);

export * from "./utils/dom";
export * from "./utils/color";
export * from "./utils/string";
