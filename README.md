# DynamicTextAnchors (DTA) <!-- omit in toc -->

![NPM Version](https://img.shields.io/npm/v/dynamic-text-anchors)

**Table of contents**

- [Annotation](#annotation)
- [Technologies used](#technologies-used)
- [Installation](#installation)
- [Styles](#styles)
- [How to use](#how-to-use)
- [DTA methods](#dta-methods)
- [Anchor methods](#anchor-methods)
- [AnchorElement methods](#anchorelement-methods)
- [Renderers](#renderers)
  - [Default Renderers](#default-renderers)
  - [How to Use](#how-to-use-1)
  - [Methods](#methods)
- [Event Bus](#event-bus)
  - [How to Use](#how-to-use-2)
  - [Methods](#methods-1)
- [Utility Methods](#utility-methods)
  - [DOM Utilities](#dom-utilities)
  - [Color Utilities](#color-utilities)
  - [String Utilities](#string-utilities)

---

## Annotation

> The thesis deals with the design of algorithms that would enable the storage of so-called text
> anchors (labels, notes etc.) in static and dynamic text (XML format) so that they can be re-
> inserted into the text even after its editing (and possibly evaluate the error during insertion). Such
> a program should then be usable as a library for e.g., web applications.

> **A note on project history and documentation** > This library was originally developed as a graduation thesis on the design of algorithms for text anchors in static and dynamic text. The codebase has since been fully rewritten to improve its architecture, performance, and maintainability.
> The DOCUMENTATION file reflects the state of the project at the time of the thesis's creation and is not intended to be updated with the current project (original code can be found in [*thesis-legacy*](/thesis-legacy/) folder).
> This README reflects the project's current state.

- [***LICENSE***](./LICENSE.md)
- [***DOCUMENTATION***](/documentation/Documentation.pdf) 

## Technologies used

-   *lib*: TS, CSS
-   *demo*: Vue.JS, TS, SCSS
  
## Installation

```bash
npm i dynamic-text-anchors
```

## Styles

For default styling of the custom elements, include the following CSS file in your project. This is optional; you can also create your own styles or easily override them.

```typescript
import 'dynamic-text-anchors/dist/_styles.css';
```

## How to use

The library's core is the `DTA` class, which serves as the main entry point and orchestrator. You instantiate it with a root DOM element and then interact with its public methods to manage anchors and renderers.

**Basic Usage Example**

Here is a quick example of how to set up the library and create highlights from a user's selection.

```typescript
// Assume your project has an HTML file with an element with id="content"

import { DTA, InlineRenderer } from 'dynamic-text-anchors';
import 'dynamic-text-anchors/dist/_styles.css'; // Optional, for default styling

// 1. Get the root element you want to work with.
const contentElement = document.getElementById('content');

if (contentElement) {
    // 2. Instantiate the DTA library
    const dta = new DTA();

    // 3. Create a renderer for how anchors will be displayed, linking it to the content element.
    const inlineRenderer = new InlineRenderer(contentElement);

    // 4. Add the renderer to the DTA instance.
    dta.addRenderer(inlineRenderer);

    // 5. Add a listener to the root element to create an anchor on selection.
    contentElement.addEventListener('mouseup', () => {
        dta.createAnchorFromSelection();
    });
}
```

-----

## DTA methods

The `DTA` class manages the lifecycle of all anchors and renderers.

  * `constructor()`\
    Instantiates the DTA library instance.

  * `addRenderer(renderer: RendererI): void`\
    Adds a new renderer to the DTA instance. This is how you tell DTA how to display anchors.

  * `removeRenderer(renderer: RendererI): void`\
    Removes a renderer and its rendered anchors from the DTA instance.

  * `createAnchorFromSelection(selection?: Selection | null): void`\
    Creates an anchor based on the current user selection. If no selection is provided, it uses the active one.

  * `createAnchorFromRange(range: Range): void`\
    Creates an anchor from a given `Range` object.

  * `removeAnchor(anchor: AnchorI): void`\
    Destroys a specific anchor and removes it from the DOM.

  * `canAnchorMerge(anchor: AnchorI, direction: MergeDirection): boolean`\
    Checks if an anchor can be merged with an adjacent anchor in a given direction (`'left'` or `'right'`).

  * `mergeAnchor(anchor: AnchorI, direction: MergeDirection): void`\
    Merges an anchor with an adjacent anchor in the specified direction.

  * `serialize(): SerializedDTA`\
    Returns a serializable JSON object of all active anchors. This can be used to save the anchors to a database.

  * `deserialize(data: SerializedDTA): void`\
    Loads a set of anchors from a serialized JSON object, rendering them in the DOM.

  * `clearAnchors(): void`\
    Destroys all anchors managed by the instance.

  * `clearRenderers(): void`\
    Destroys all renderers and their rendered content.

  * `destroy(): void`\
    Destroys the DTA instance, all anchors, and all renderers.

-----

## Anchor methods

The `Anchor` class represents a single text highlight. You typically interact with it via the `DTA` instance, but you can also manipulate it directly.

  * `constructor(range: DTARange)`\
    Instantiates a new Anchor object from a `DTARange` object. A unique id is automatically generated.

  * `setColor(bg: ColorValue, fg?: ColorValue): void`\
    Sets the background and optional foreground colors of the anchor. The `fg` defaults to an inverted version of `bg`.

  * `setRange(range: DTARange): void`\
    Updates the anchor's underlying range.

  * `acceptChange(): void`\
    Marks the anchor’s change as accepted (e.g., removes the "changed" state).

  * `requestFocus(focus: boolean): void`\
    Emits a request to the Event Bus for the anchor's associated element to be focused or unfocused.

  * `requestMerge(direction: MergeDirection): void`\
    Emits a request to the Event Bus for the anchor to be merged with a neighboring anchor.

  * `serialize(): SerializedAnchor`\
    Returns a serializable JSON object of the anchor's data.

  * `static deserialize(data: SerializedAnchor): Anchor`\
    Creates a new Anchor instance from a serialized JSON object.

  * `destroy(): void`\
    Removes the anchor from the DTA instance and the DOM.

-----

## AnchorElement methods

The `AnchorElement` is a custom DOM element that represents the rendered anchor.  

  * `render(): void`\
    Renders the element into the DOM.

  * `requestFocus(focus: boolean): void`\
    Requests that the element gain or lose focus.

  * `requestHover(hover: boolean): void`\
    Requests that the element gain or lose hover state.

  * `requestMerge(direction: MergeDirection): void`\
    Requests a merge action for this anchor element.

  * `requestDestroy(): void`\
    Requests removal of this anchor element.

  * `toggleFocus(focus: boolean): void`\
    Applies or removes the focus state on the element.

  * `toggleHover(hover: boolean): void`\
    Applies or removes the hover state on the element.

  * `destroy(): void`\
    Removes the element from the DOM and performs cleanup.

-----

## Renderers

Renderers are responsible for the visual representation of anchors. The library provides abstract base classes to help you create your own, and two built-in renderers to get you started.

###  Default Renderers

  * `InlineRenderer`: Renders anchors as inline elements that wrap the text.
  * `ListRenderer`: Renders anchors as list items in a separate container.

###  How to Use

You must add a renderer to a DTA instance to see any anchors rendered.

```typescript
const dta = new DTA();
const listRenderer = new ListRenderer(document.getElementById('list-container'));
dta.addRenderer(listRenderer);
```

### Methods

  * `renderAnchor(anchor: AnchorI): void`\
    Renders a specific anchor in the DOM.

  * `updateAnchor(anchor: AnchorI): void`\
    Updates the visual representation of a rendered anchor. The default implementation calls `removeAnchor` and then `renderAnchor`.

  * `removeAnchor(anchor: AnchorI): void`\
    Removes a rendered anchor from the DOM.

  * `focusAnchor(anchor: AnchorI, focus: boolean): void`\
    Toggles the focus state of the rendered anchor element.

  * `hoverAnchor(anchor: AnchorI, hover: boolean): void`\
    Toggles the hover state of the rendered anchor element.

  * `destroy(): void`\
    Destroys the renderer and removes all of its rendered content from the DOM.

-----

## Event Bus

The library uses a global `EventBus` to handle communication between different components. All components have an event bus instance you can listen to.

###  How to Use

```typescript
import { EventBus } from "dynamic-text-anchors";

const eventBus = EventBus.getInstance();

eventBus.on("anchor:create", (event) => {
    console.log("New anchor created:", event.payload.anchor.id);
}, this);
```

### Methods

  * `on<K extends keyof EventMap>(type: K, fn: (event: Event<K>) => void, target: any): void`\
    Subscribes a function to a specific event type. The target is used for cleanup.

  * `off<K extends keyof EventMap>(type: K, fn: (event: Event<K>) => void, target: any): void`\
    Unsubscribes a specific function from an event.

  * `offAll(target: any): void`\
    Removes all subscriptions for a given target object.

  * `emit<K extends keyof EventMap>(event: Event<K>): void`\
    Emits an event, triggering all subscribed functions.

-----

## Utility Methods

A small set of utility functions are also exported for convenience.

### DOM Utilities

  * `getSelection(): Selection | null`\
    Returns the active `Selection` object or `null`.

  * `buildTextIndex(root: Node): TextIndex`\
    Creates an index of all text nodes within a root element, mapping character positions to DOM nodes.

  * `deserializeRange(range: DTARange, root: Node): Range | null`\
    Reconstructs a `Range` object from a serialized `DTARange` object within a given root node.

  * `getAllTextNodes(range: Range): Text[]`\
    Returns all text nodes within a given `Range` object.

### Color Utilities

  * `isValidHexColor(color: string): boolean`\
    Checks if a string is a valid hex color string.

  * `invertHexColor(hex: string): ColorValue`\
    Inverts a hex color to be readable on the original color.

  * `adjustColorBrightness(hex: string, percent: number): ColorValue`\
    Adjusts the brightness of a hex color by a given percentage.

  * `generateRandomColor(): ColorValue`\
    Generates a random valid hex color.

### String Utilities

  * `normalizeString(str: string): string`\
    Returns a string in a normalized form by removing diacritics, punctuation, numbers, and collapsing whitespace.

  * `escapeRegExp(str: string): string`\
    Escapes a string for use in a regular expression.

  * `calculateStringSimilarity(str1: string, str2: string): number`\
    Calculates the similarity between two strings using the Levenshtein distance algorithm.
