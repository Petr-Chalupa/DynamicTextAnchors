# DynamicTextAnchors (DTA)

**Table of contents**

- [DynamicTextAnchors (DTA)](#dynamictextanchors-dta)
  - [Annotation](#annotation)
  - [Important files](#important-files)
  - [Installation](#installation)
  - [Technologies used](#technologies-used)
  - [How to use](#how-to-use)
    - [createAnchorBlockFromSelection()](#createanchorblockfromselection)
    - [destroyAnchorBlocks()](#destroyanchorblocks)
    - [serialize()](#serialize)
    - [deserialize()](#deserialize)

---

## Annotation

> The thesis deals with the design of algorithms that would enable the storage of so-called text
> anchors (labels, notes etc.) in static and dynamic text (XML format) so that they can be re-
> inserted into the text even after its editing (and possibly evaluate the error during insertion). Such
> a program should then be usable as a library for e.g., web applications.

## Important files

1.  #### [LICENSE FILE](./LICENSE.md)
2.  #### [DOCUMENTATION FILE](/documentation/Documentation.pdf)

## Installation

`npm i dynamic-text-anchors`

## Technologies used

- lib
  - TS
- demo
  - Vue.JS
  - SCSS

## How to use

`import DTA from "dynamic-text-anchors";`

Now you can use DTA methods

### createAnchorBlockFromSelection()

Creates AnchorBlock from given selection or from the user's current selection. Selection must be contained within the configured rootNode. Multiple selection ranges _are_ supported.

### destroyAnchorBlocks()

Destroys the specified AnchorBlocks and their Anchors, or destroys all AnchorBlocks if none are specified.

### serialize()

Returns the DTA data ready to be saved.

### deserialize()

Attempts to reconstruct AnchorBlocks and Anchors from the given data.
