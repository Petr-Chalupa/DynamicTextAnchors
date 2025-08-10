# DynamicTextAnchors (DTA)

![NPM Version](https://img.shields.io/npm/v/dynamic-text-anchors)

**Table of contents**

- [DynamicTextAnchors (DTA)](#dynamictextanchors-dta)
  - [Annotation](#annotation)
  - [Installation](#installation)
  - [Technologies used](#technologies-used)
  - [How to use](#how-to-use)
    - [DTA methods](#dta-methods)
      - [`createAnchorBlockFromSelection([selection])`](#createanchorblockfromselectionselection)
      - [`removeAnchorBlocks([anchorBlocks], [destroy])`](#removeanchorblocksanchorblocks-destroy)
      - [`getTextNodeContainer(node)`](#gettextnodecontainernode)
      - [`sort()`](#sort)
      - [`serialize()`](#serialize)
      - [`deserialize(data)`](#deserializedata)
    - [AnchorBlock methods](#anchorblock-methods)
      - [`createAnchor(node, startOffset, endOffset)`](#createanchornode-startoffset-endoffset)
      - [`joinAnchors()`](#joinanchors)
      - [`removeAnchors([anchors], [destroy])`](#removeanchorsanchors-destroy)
      - [`setFocused(focused, [anchors])`](#setfocusedfocused-anchors)
      - [`merge(to)`](#mergeto)
      - [`serialize()`](#serialize-1)
    - [Anchor methods](#anchor-methods)
      - [`destroy()`](#destroy)
      - [`setChanged(changed)`](#setchangedchanged)
      - [`setFocused(focused)`](#setfocusedfocused)
      - [`color(color)`](#colorcolor)
      - [`serialize()`](#serialize-2)
    - [Utility methods](#utility-methods)
      - [`getPathFromNode(rootNode, node)`](#getpathfromnoderootnode-node)
      - [`getNodeFromPath(rootNode, xPath, resType)`](#getnodefrompathrootnode-xpath-restype)
      - [`getAllTextNodes(rootNode)`](#getalltextnodesrootnode)
      - [`getConnectingTextNodes(rootNode, boundaryTextNode)`](#getconnectingtextnodesrootnode-boundarytextnode)
      - [`normalizeString(str)`](#normalizestringstr)
      - [`nodePositionComparator(x, y)`](#nodepositioncomparatorx-y)
      - [`splitArrayToChunks(array, del)`](#splitarraytochunksarray-del)
      - [`isValidHexColor(hex)`](#isvalidhexcolorhex)
      - [`invertHexColor(hex)`](#inverthexcolorhex)

---

## Annotation

> The thesis deals with the design of algorithms that would enable the storage of so-called text
> anchors (labels, notes etc.) in static and dynamic text (XML format) so that they can be re-
> inserted into the text even after its editing (and possibly evaluate the error during insertion). Such
> a program should then be usable as a library for e.g., web applications.

- [***LICENSE***](./LICENSE.md)
- [***DOCUMENTATION***](/documentation/Documentation.pdf) (Reflects the state of the project at the time of its creation; not intended to be updated with the project)

## Installation

`npm i dynamic-text-anchors`

## Technologies used

-   lib
    -   TS
    -   CSS
-   demo
    -   Vue.JS
    -   SCSS

## How to use

`import DTA from "dynamic-text-anchors";`

`const dta = new DTA(rootElement);`

You can also import default styles:

`import "dynamic-text-anchors/dist/lib/_styles.css";`

### DTA methods

#### `createAnchorBlockFromSelection([selection])`

Creates AnchorBlock/s from given selection or from the user's current selection. Selection must be contained within the configured rootNode. Multiple selection ranges _are_ supported (Firefox).

#### `removeAnchorBlocks([anchorBlocks], [destroy])`

Removes the specified AnchorBlocks and their Anchors (or all, if none are specified). Accepts argument telling the function whether it should remove the Anchors from the AnchorBlock and if so, whether it should also remove them from the document either completely or "silently".

#### `getTextNodeContainer(node)`

Returns AnchorBlock containing specified textnode. If none of the AnchorBlocks is an ancestor, returns null.

#### `sort()`

Sorts AnchorBlocks by their position in the document by comparing position of the last Anchor and first Anchor of following AnchorBlocks. This method sorts in-place and expects, that individual AnchorBlock's Anchors are sorted.

#### `serialize()`

Returns the DTA data serialized in JSON object format ready to be saved.

#### `deserialize(data)`

Attempts to reconstruct AnchorBlocks and Anchors from the given data in JSON object format.

---

_The following methods are not intended for stand-alone use (but only through DTA), but are described here for a better understanding of the mechanisms._

### AnchorBlock methods

#### `createAnchor(node, startOffset, endOffset)`

Creates Anchor in specified node at specified offsets, that must be contained in the node. Returns the created Anchor.

#### `joinAnchors()`

Helper function that sorts AnchorBlock's Anchors in-place, sets the focusable Anchor, merges connecting Anchors if possible, sets aria-label and connects the Anchors internally via leftJoin and rightJoin properties.

#### `removeAnchors([anchors], [destroy])`

Removes the specified Anchors (or all, if none are specified). Accepts argument telling the function whether it should remove the Anchors from the AnchorBlock and if so, whether it should also remove them from the document either completely or "silently".

#### `setFocused(focused, [anchors])`

Adds or removes focus from specified Anchors (or all, if none are specified).

#### `merge(to)`

Attempts to merge AnchorBlock with following or preceding AnchorBlock (specified by parameter "left" or "right"). Both of the AchorBlocks must be touching. The merging AnchorBlock overrides, when there is conflict in properties and/or data.

#### `serialize()`

Returns the AnchorBlock data serialized in JSON object format ready to be saved.

---

### Anchor methods

#### `destroy()`

Silently removes the Anchor from the document (= replace itself by textnode with it's value).

#### `setChanged(changed)`

Adds or removes data-changed attribute of Anchor.

#### `setFocused(focused)`

Adds or removes focus and data-focused attribute of Anchor.

#### `color(color)`

Sets the background color of Anchor.

#### `serialize()`

Returns the Anchor data serialized in JSON object format ready to be saved.

---

### Utility methods

#### `getPathFromNode(rootNode, node)`

Returns the xPath string from rootNode to node. 


#### `getNodeFromPath(rootNode, xPath, resType)`

Evaluates the xPath - starting from the rootNode and returns it in the desired XPathResult type.


#### `getAllTextNodes(rootNode)`

Returns all text nodes in the rootNode.


#### `getConnectingTextNodes(rootNode, boundaryTextNode)`

Returns all text nodes in the rootNode, that are connecting to the boundaryTextNode (result includes both directions).


#### `normalizeString(str)`

Returns the string in the normalized form - without diacritics, special symbols, with trimmed spaces and in lowercase.


#### `nodePositionComparator(x, y)`

Returns the evaluated result of `Node.compareDocumentPosition()` method.


#### `splitArrayToChunks(array, del)`

Splits given array into array of smaller chunks by the given delimiter.


#### `isValidHexColor(hex)`

Checks if the given hex color is valid.


#### `invertHexColor(hex)`

Returns `#ffffff` or `#000000` depending on the contrast with the given hex color.