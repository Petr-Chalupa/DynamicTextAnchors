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
      <!-- <div v-if="focusedAnchor !== null">
        <h4 @click="focusAnchorBlock(focusedAnchor.anchorBlock.uuid)">
          AnchorBlock: {{ focusedAnchor.anchorBlock.uuid }}
        </h4>
        <div class="data">
          <input type="color" v-model="focusedAnchor.anchorBlock.color" />
          <pre contenteditable="true" title="Data" ref="dataEditor">{{ JSON.stringify(focusedAnchor.anchorBlock.data, null, 2) }}</pre>
          <button @click="saveAnchorData(focusedAnchor.anchorBlock)" class="saveDataBtn">
            Save data
          </button>
          <p class="merge">
            [{{ focusedAnchor.anchorBlock.canMerge("left") !== null ? "Can" : "Can't" }} merge to left,
            {{ focusedAnchor.anchorBlock.canMerge("right") !== null ? "Can" : "Can't" }} merge to right]
          </p>
        </div>
        <details class="parts">
          <summary>Anchors</summary>
          <div>
            <div v-for="anchor in focusedAnchor.anchorBlock.anchors" :key="anchor.uuid" class="anchor">
              <h6>{{ anchor.uuid }}</h6>
              <p>{{ anchor.value }}</p>
              <p class="changed">
                {{Object.keys(anchor.dataset).find((attr) => attr === "changed")}}
              </p>
            </div>
          </div>
        </details>
      </div> -->
    </div>
  </div>
</template>

<style lang="scss" src="@/assets/scss/main.scss" />
<style lang="css" src="../../../dist/lib/_styles.css" />

<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed, type Ref } from "vue";
import LoremGenerator from "./LoremGenerator.vue";

import { DTA, InlineRenderer } from "../../../dist/lib/index.js";
import type { DTAI, AnchorI } from "../../../dist/lib/types.js";

const textfield: Ref<HTMLElement | null> = ref(null);
const loremXML = ref("");
const useMode = ref(true);
const loadXMLInput = ref<HTMLInputElement | null>(null);
const loadAnchorsInput = ref<HTMLInputElement | null>(null);
const focusedAnchor = ref<AnchorI | null>(null);
const dataEditor = ref<HTMLPreElement | null>(null);
const controlsDisabled = computed(() => loremXML.value.length === 0 || !useMode.value);

let dta: DTAI | null = null;

onMounted(() => {
  if (!textfield.value) return;

  dta = new DTA();
  dta.addRenderer(new InlineRenderer(textfield.value))
});

onUnmounted(() => {
  dta = null;
});

function handleGenXML(xml: string) {
  loremXML.value = xml;
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
    // dta.deserialize(parsed.data);
  } catch (err) {
    console.error("Error parsing anchors", err);
  }
}

function saveAnchors() {
  // if (!dta) return;
  // const serialized = dta.serialize();

  // const file = new Blob([JSON.stringify(serialized, null, 2)], {
  //   type: "application/json",
  // });
  // const link = document.createElement("a");
  // link.href = URL.createObjectURL(file);
  // link.download = "Anchors.json";
  // link.click();
}

function createAnchor() {
  if (!dta) return;
  dta.createAnchorFromSelection();
}

function focusAnchor(uuid: string) {
  // if (!dta) return;
  // const anchor = dta.anchors.find((a) => a.uuid === uuid);
  // if (anchor) {
  //   focusedAnchor.value = anchor;
  //   anchor.focus();
  // }
}

function saveAnchorData(anchor: AnchorI) {
  // if (!dataEditor.value) return;
  // try {
  //   const raw = dataEditor.value.textContent || "{}";
  //   anchor.data = JSON.parse(raw);
  // } catch (err) {
  //   console.error("Invalid JSON", err);
  // }
}
</script>
