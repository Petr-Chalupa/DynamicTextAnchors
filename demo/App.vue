<template>
    <main>
        <header>
            <div class="brand">DTA demo</div>

            <nav class="links">
                <a href="https://www.npmjs.com/package/dynamic-text-anchors" target="_blank" rel="noreferrer">npm</a>
                <a href="https://github.com/Petr-Chalupa/DynamicTextAnchors" target="_blank" rel="noreferrer">github</a>
            </nav>
        </header>

        <section>
            <div class="panel-head">Document</div>
            <div ref="editor" class="editor" contenteditable="true" spellcheck="false">Dynamic documents change. Text moves, nodes are inserted, removed, or restructured. Dynamic Text Anchors keeps a stable textual reference through these changes.</div>
        </section>

        <section>
            <div class="panel-head">Actions</div>
            <div class="action-grid">
                <button type="button" @click="generateAnchors">Generate</button>
                <label><input v-model.number="anchorCount" type="number" min="1" max="10000" /> anchors</label>
                <button type="button" @click="mutateDocument">Mutate</button>
                <label><input v-model.number="mutationSize" type="number" min="0" max="1000" /> chars</label>
                <button type="button" @click="resolveAnchors">Resolve</button>
                <div v-if="benchmark" class="result">
                    <span>{{ benchmark.count }} anchors</span>
                    <span class="resolved">{{ benchmark.resolved }} resolved</span>
                    <span class="orphaned">{{ benchmark.orphaned }} orphaned</span>
                    <strong>{{ benchmark.duration.toFixed(2) }} ms</strong>
                </div>
            </div>
        </section>

        <section>
            <div class="panel-head">Anchors</div>
            <div v-if="anchors.length" class="anchors">
                <div v-for="(item, index) in anchors" :key="index" class="anchor-row">
                    <span class="anchor-index">{{ index + 1 }}</span>
                    <span class="context prefix">{{ item.anchor.prefix }}</span><strong>{{ item.anchor.exact || "empty" }}</strong><span class="context suffix">{{ item.anchor.suffix }}</span>
                    <em v-if="item.resolution" :class="item.resolution.status">
                        <template v-if="item.resolution.status === 'resolved'">{{ item.resolution.method }}: <span class="confidence">{{ " " + (item.resolution.confidence * 100).toFixed(0) }}%</span></template>
                        <template v-else>orphaned</template>
                    </em>
                </div>
            </div>
        </section>
    </main>
</template>

<style lang="css">
:root {
    color-scheme: dark;
    font-family: Inter, system-ui, sans-serif;
    background: #0b0b0d;
    color: #f5f5f5;
}

* {
    box-sizing: border-box;
}

html,
body,
#app {
    margin: 0;
    min-height: 100%;
    height: 100%;
    background: #0b0b0d;
}

body {
    line-height: 1.5;
}

button,
input,
a {
    font: inherit;
}

main {
    max-width: 760px;
    margin: 0 auto;
    padding: 32px 20px 48px;
}

header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 20px;
}

.brand {
    font-size: 14px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #d4d4d8;
}

.links {
    display: flex;
    gap: 10px;

    a {
        color: #d4d4d8;
        text-decoration: none;
        font-size: 12px;
        opacity: 0.8;

        &:hover {
            opacity: 1;
        }
    }
}

section {
    background: transparent;
    border-top: 1px solid #2a2a2f;
    border-bottom: 1px solid #2a2a2f;
    margin-bottom: 0;

    &+section {
        border-top: 0;
    }

    .panel-head {
        padding: 12px 0;
        font-size: 11px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #a1a1aa;
    }
}

.editor {
    display: block;
    width: 100%;
    border: 0;
    background: transparent;
    color: #f5f5f5;
    padding: 0 0 18px;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 16px;
    line-height: 1.7;

    &:focus {
        outline: none;
    }
}

button,
input {
    border: 0;
    border-bottom: 1px solid #55555d;
    background: transparent;
    color: #f5f5f5;
}

button {
    padding: 3px 8px;
    border: 1px solid #45454d;
    border-radius: 3px;
    cursor: pointer;
    transition: border-color 120ms ease, color 120ms ease, background-color 120ms ease;

    &:hover {
        border-color: #777780;
        background: #17171b;
        color: #f5f5f5;
    }

    &:focus-visible {
        outline: 1px solid #85858d;
        outline-offset: 2px;
    }
}

.action-grid {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    column-gap: 20px;
    row-gap: 12px;
    padding-bottom: 14px;

    label {
        color: #a1a1aa;
        font-weight: normal;
    }

    input {
        width: 5rem;
        padding: 0;
        text-align: right;
        color: #f5f5f5;
    }
}

.result,
.anchors {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
    padding: 0 0 14px;
    color: #a1a1aa;
    font-size: 12px;
}

.result {
    margin-left: auto;
    justify-content: flex-end;
    padding: 0;

    strong {
        color: #f5f5f5;
        font-weight: normal;
    }
}

.result .resolved,
.anchors .resolved {
    color: #88b89a;
}

.result .orphaned,
.anchors .orphaned {
    color: #c88787;
}

.anchors {
    display: block;
    max-height: 30vh;
    overflow: auto;

    .anchor-row {
        display: flex;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        gap: 0.5rem;
        padding-right: 0.25rem;
    }

    .anchor-index {
        display: inline-block;
        min-width: 1.5rem;
        color: #85858d;
    }

    .context {
        min-width: 0;
        overflow: hidden;
        color: #85858d;
        text-align: left;
        text-overflow: ellipsis;
    }

    strong {
        min-width: 0;
        overflow: hidden;
        color: #f5f5f5;
        font-weight: normal;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    em {
        margin-left: auto;
    }
}
</style>

<script setup lang="ts">
import { ref } from "vue";
import { DTA, type Anchor, type AnchorResolution } from "../lib/core/index";
import { HtmlAdapter } from "../lib/adapters/html";
import { ReferenceResolver } from "../lib/resolvers/reference";
type AnchorItem = { anchor: Anchor; resolution?: AnchorResolution };

const editor = ref<HTMLElement>();
const anchors = ref<AnchorItem[]>([]);
const anchorCount = ref(100);
const mutationSize = ref(40);
const benchmark = ref<{ count: number; resolved: number; orphaned: number; duration: number }>();

const createDta = () => {
    if (!editor.value) return undefined;

    return new DTA({
        root: editor.value,
        adapter: new HtmlAdapter(),
        classifier: () => "include",
        resolvers: [new ReferenceResolver()],
    });
};

const createAnchorFromTextRange = (dta: DTA<Node, Range>, start: number, end: number) => {
    const treeRange = dta.projector.mapTextToTree(dta.projection, { start, end });
    return dta.createAnchor(dta.config.adapter.fromTreeRange(dta.tree, treeRange));
};

const generateAnchors = () => {
    const dta = createDta();
    if (!dta || !dta.projection.text.length) return;

    const generated = Array.from({ length: anchorCount.value }, () => {
        const start = Math.floor(Math.random() * dta.projection.text.length);
        const length = Math.min(12, dta.projection.text.length - start);
        return createAnchorFromTextRange(dta, start, start + length);
    });

    anchors.value = generated.map((anchor) => ({ anchor }));
    benchmark.value = undefined;
};

const mutateDocument = () => {
    if (!editor.value) return;
    const text = editor.value.textContent ?? "";
    const size = Math.min(mutationSize.value, 1000);
    if (size <= 0) return;
    const insert = ` ${Array.from({ length: size }, (_, index) => String.fromCharCode(97 + (index % 26))).join("")}`;
    const position = Math.floor(Math.random() * (text.length + 1));
    editor.value.textContent = text.slice(0, position) + insert + text.slice(position);
    anchors.value = anchors.value.map((item) => ({ anchor: item.anchor }));
    benchmark.value = undefined;
};

const resolveAnchors = () => {
    if (!anchors.value.length) return;
    const changedDta = createDta();
    if (!changedDta) return;

    const started = performance.now();
    const resolutions = changedDta.resolve(anchors.value.map((item) => item.anchor));
    const duration = performance.now() - started;
    const resolved = resolutions.filter((resolution: AnchorResolution) => resolution.status === "resolved").length;

    anchors.value = anchors.value.map((item, index) => ({ anchor: item.anchor, resolution: resolutions[index] }));
    benchmark.value = {
        count: resolutions.length,
        resolved,
        orphaned: resolutions.length - resolved,
        duration,
    };
};
</script>