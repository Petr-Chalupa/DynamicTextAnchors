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

    <div v-show="clickedAnchor != null" id="anchor-details" ref="anchorDetails">
      <div v-if="clickedAnchor != null">
        <h4 @click="focusAnchorBlock(clickedAnchor.anchorBlock.uuid)">AnchorBlock: {{ clickedAnchor.anchorBlock.uuid }}</h4>
        <div class="settings">
          <input type="color" v-model="clickedAnchor.anchorBlock.color" />
          <pre contenteditable="true" title="Data">{{ JSON.stringify(clickedAnchor.anchorBlock.data, null, 2) }}</pre>
          <button @click="(e) => saveAnchorData(clickedAnchor.anchorBlock, e.target.previousSibling.textContent)" class="saveDataBtn">Save data</button>
        </div>
        <details class="parts">
          <summary>Anchors</summary>
          <div>
            <div v-for="anchor in clickedAnchor.anchorBlock.anchors" :key="anchor.uuid">
              <h6>{{ anchor.uuid }}</h6>
              <p>{{ anchor.value }}</p>
            </div>
          </div>
        </details>
      </div>
    </div>
  </div>
</template>

<style lang="scss" src="@/assets/scss/main.scss" />

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
const clickedAnchor = ref(null);

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

function displayAnchorBlockDetails(e) {
  if (/^DTA-ANCHOR$/i.test(e.target.nodeName)) return clickedAnchor.value = e.target;
  else if (!anchorDetails.value.contains(e.target)) return clickedAnchor.value = null;
}
document.addEventListener("click", displayAnchorBlockDetails);
document.addEventListener("focusin", displayAnchorBlockDetails);
</script>