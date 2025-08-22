<template>
  <nav>
    <h1>DTA DEMO</h1>
    <a href="https://github.com/Petr-Chalupa" target="_blank">AUTHOR</a>
    <a href="https://www.npmjs.com/package/dynamic-text-anchors?activeTab=readme" target="_blank">README</a>
  </nav>

  <div id="container">
    <div id="textfield" v-html="loremXML" :contenteditable="!useMode" ref="textfield"></div>

    <div id="controls">
      <LoremGenerator @gen-xml="handleGenXML" />
      <label class="button" tabindex="0">
        LOAD XML
        <input type="file" accept="application/xml" @input="loadXML" ref="loadXMLInput" />
      </label>
      <button @click="saveXML" :disabled="controlsDisabled">SAVE XML</button>
      <label class="button" :disabled="controlsDisabled" tabindex="0">
        LOAD ANCHORS
        <input type="file" accept="application/json" @input="loadAnchors" ref="loadAnchorsInput" />
      </label>
      <button @click="saveAnchors" :disabled="controlsDisabled">SAVE ANCHORS</button>
      <button @click="createAnchor" :disabled="controlsDisabled">CREATE ANCHOR</button>
    </div>

    <div v-show="focusedAnchor !== null" id="anchor-details" ref="anchorDetails">
      <div v-if="focusedAnchor !== null">
        <h4 @click="focusedAnchor.requestFocus(true)">Anchor: {{ focusedAnchor.id }}</h4>
        <div class="data">
          <label>BG: <input type="color" :value="focusedAnchor.bgColor" @input="e => focusedAnchor?.setColor((e.target as HTMLInputElement)?.value as ColorValue, focusedAnchor.fgColor)" />
          </label>
          <label>FG: <input type="color" :value="focusedAnchor.fgColor" @input="e => focusedAnchor?.setColor(focusedAnchor.bgColor, (e.target as HTMLInputElement)?.value as ColorValue)" />
          </label>
          <details class="quote">
            <summary>Quote Data</summary>
            <pre title="Quote">{{ JSON.stringify(focusedAnchor.range.quote, null, 2) }}</pre>
          </details>
          <p class="merge">
            <button :disabled="!canMerge(focusedAnchor, 'left')" @click="focusedAnchor.requestMerge('left')">Merge LEFT</button>
            <button :disabled="!canMerge(focusedAnchor, 'right')" @click="focusedAnchor.requestMerge('right')">Merge RIGHT</button>
          </p>
          <p class="changed">
            {{ focusedAnchor.changed ? "Changed" : "Unchanged" }}
            <button :disabled="!focusedAnchor.changed" @click="focusedAnchor.acceptChange()">Accept change</button>
          </p>
          <p class="range"><strong>Range:</strong> {{ focusedAnchor.range.start }} - {{ focusedAnchor.range.end }}</p>
        </div>
        <button @click="destroyAnchor(focusedAnchor)" class="destroyBtn">Destroy Anchor</button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" src="@/assets/scss/main.scss" />
<style lang="css" src="dynamic-text-anchors/utils/_styles.css" />

<script setup lang="ts">
import { onMounted, ref, computed, type Ref } from "vue";
import LoremGenerator from "./LoremGenerator.vue";

import { DTA, InlineRenderer } from "dynamic-text-anchors";
import type { DTAI, AnchorI, MergeDirection, ColorValue, SerializedDTA } from "dynamic-text-anchors/types.js";

const textfield: Ref<HTMLElement | null> = ref(null);
const loremXML = ref("");
const useMode = ref(true);
const loadXMLInput = ref<HTMLInputElement | null>(null);
const loadAnchorsInput = ref<HTMLInputElement | null>(null);
const focusedAnchor = ref<AnchorI | null>(null);
const controlsDisabled = computed(() => loremXML.value.length === 0 || !useMode.value);

let dta: DTAI = new DTA();

onMounted(() => {
  if (!textfield.value) return;

  dta.addRenderer(new InlineRenderer(textfield.value));
  dta.eventBus.on("anchor:focus-request", (event) => {
    if (event.payload.focus) focusedAnchor.value = event.payload.anchor;
  }, dta);
  dta.eventBus.on("anchor:change", (event) => {
    if (focusedAnchor.value && event.payload.anchor.id === focusedAnchor.value.id) {
      focusedAnchor.value = null; // Reset the reference
      focusedAnchor.value = event.payload.anchor;
    }
  }, dta);
});

function handleGenXML(xml: string) {
  loremXML.value = xml;
  dta.clearAnchors();
}

async function loadXML() {
  const input = loadXMLInput.value;
  if (!input?.files?.[0]) return;

  const file = input.files[0];
  const text = await file.text();
  loremXML.value = text;
}

function saveXML() {
  const file = new Blob([loremXML.value], { type: "application/xml" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(file);
  link.download = "XML.xml";
  link.click();
}

async function loadAnchors() {
  if (!dta) return;
  const input = loadAnchorsInput.value;
  if (!input?.files?.[0]) return;

  const file = input.files[0];
  const text = await file.text();
  try {
    const parsed = JSON.parse(text);
    dta.deserialize(parsed as SerializedDTA);
  } catch (err) {
    console.error("Error parsing anchors", err);
  }
}

function saveAnchors() {
  const serialized = dta.serialize();

  const file = new Blob([JSON.stringify(serialized, null, 2)], {
    type: "application/json",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(file);
  link.download = "Anchors.json";
  link.click();
}

function createAnchor() {
  dta.createAnchorFromSelection();
}

function canMerge(anchor: AnchorI, direction: MergeDirection) {
  return dta.canAnchorMerge(anchor, direction);
}

function destroyAnchor(anchor: AnchorI) {
  anchor.destroy();
  focusedAnchor.value = null;
} 
</script>
