<template>
  <nav>
    <h1>DTA DEMO</h1>
    <a href="https://github.com/Petr-Chalupa" target="_blank">AUTHOR</a>
    <a href="https://github.com/Petr-Chalupa/DynamicTextAnchors" target="_blank">README</a>
  </nav>

  <div id="container">
    <div id="textfield" v-html="loremXML" :contenteditable="!useMode" ref="textfield"></div>

    <div id="controls">
      <LoremGenerator @genXML="genXML" />
      <label class="button" tabindex="0">LOAD XML <input type="file" accept="application/xml" @input="loadXML" ref="loadXMLInput" /></label>
      <button @click="saveXML" :disabled="controlsDisabled">SAVE XML</button>
      <label class="button" :disabled="controlsDisabled" tabindex="0">LOAD ANCHORS <input type="file" accept="application/json" @input="loadAnchors" ref="loadAnchorsInput" /></label>
      <button @click="saveAnchors" :disabled="controlsDisabled">SAVE ANCHORS</button>
      <button @click="createAnchorBlock" :disabled="controlsDisabled">CREATE ANCHOR</button>
    </div>

    <div v-show="focusedAnchor != null" id="anchor-details" ref="anchorDetails">
      <div v-if="focusedAnchor != null">
        <h4 @click="focusAnchorBlock(focusedAnchor.anchorBlock.uuid)">AnchorBlock: {{ focusedAnchor.anchorBlock.uuid }}</h4>
        <div class="data">
          <input type="color" v-model="focusedAnchor.anchorBlock.color" />
          <pre contenteditable="true" title="Data">{{ JSON.stringify(focusedAnchor.anchorBlock.data, null, 2) }}</pre>
          <button @click="(e) => saveAnchorData(focusedAnchor.anchorBlock, e.target.previousSibling.textContent)" class="saveDataBtn">Save data</button>
          <p class="merge">[{{ focusedAnchor.anchorBlock.canMerge("left") != null ? "Can" : "Can't" }} merge to left, {{ focusedAnchor.anchorBlock.canMerge("right") != null ? "Can" : "Can't" }} merge to right]</p>
        </div>
        <details class="parts">
          <summary>Anchors</summary>
          <div>
            <div v-for="anchor in focusedAnchor.anchorBlock.anchors" :key="anchor.uuid" class="anchor">
              <h6>{{ anchor.uuid }}</h6>
              <p>{{ anchor.value }}</p>
              <p class="changed">{{ Object.keys(anchor.dataset).find((attr) => attr === "changed") }}</p>
            </div>
          </div>
        </details>
      </div>
    </div>
  </div>
</template>

<style lang="scss" src="@/assets/scss/main.scss" />
<style lang="css" src="../../../dist/lib/_styles.css" />

<script setup>
import { computed, onMounted, ref } from "vue";
import LoremGenerator from "./LoremGenerator.vue";
import DTA from "../../../dist/lib/index.js";

const textfield = ref(null);
const loremXML = ref("");
const useMode = ref(true);
const controlsDisabled = computed(() => (loremXML.value.length === 0 || !useMode.value));
const loadXMLInput = ref(null);
const loadAnchorsInput = ref(null);
const anchorDetails = ref(null);
const focusedAnchor = ref(null);

let dta = null;
onMounted(() => dta = new DTA(textfield.value));

function genXML(XML) {
  loremXML.value = XML;
}

function loadXML() {
  const file = loadXMLInput.value.files[0];
  if (!file) return;

  const fileReader = new FileReader();
  fileReader.readAsText(file);
  fileReader.onload = (e) => {
    loremXML.value = e.target.result;
    dta = new DTA(textfield.value);
  }
}

function saveXML() {
  const file = new Blob([loremXML.value], { type: "application/json" });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(file);
  link.download = "XML.xml";
  link.click();
}

function loadAnchors() {
  const file = loadAnchorsInput.value.files[0];
  if (!file) return;

  const fileReader = new FileReader();
  fileReader.readAsText(file);
  fileReader.onload = (e) => {
    dta.deserialize(JSON.parse(e.target.result));
  }
}

function saveAnchors() {
  const serializedData = dta.serialize();
  const file = new Blob([JSON.stringify(serializedData)], { type: "application/json" });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(file);
  link.download = "Anchors.json";
  link.click();
}

function createAnchorBlock() {
  dta.createAnchorBlockFromSelection();
}

function focusAnchorBlock(uuid) {
  dta.anchorBlocks.find((anchorBlock) => anchorBlock.uuid === uuid)?.anchors[0].focus();
}

function saveAnchorData(anchorBlock, rawData) {
  try {
    const data = JSON.parse(rawData);
    anchorBlock.data = data;
  } catch (err) {
    console.error(err);
  }
}

const anchorFocusObserver = new MutationObserver((mutationList, observer) => {
  for (const mutation of mutationList) {
    if (mutation.type === "attributes" && mutation.attributeName === "data-focused") {
      if (mutation.target.dataset.focused) focusedAnchor.value = mutation.target;
    }
  }
});
onMounted(() => anchorFocusObserver.observe(textfield.value, { attributes: true, childList: false, subtree: true }));
</script>