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
            <textarea class="editor"
                spellcheck="false">Dynamic documents change. Text moves, nodes are inserted, removed, or restructured. Dynamic Text Anchors keeps a stable textual reference through these changes.</textarea>
        </section>

        <section>
            <div class="panel-head">Actions</div>
        </section>

        <section>
            <div class="panel-head">Anchors</div>
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
textarea,
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

        & a:hover {
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
    min-height: 220px;
    resize: vertical;
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
</style>

<script setup lang="ts">
</script>