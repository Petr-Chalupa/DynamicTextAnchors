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

    <div id="anchors" :key="forceAnchorsRerenderKey">
      <h3>Anchor Blocks</h3>
      <div v-if="!dta || dta.anchorBlocks.length === 0"><i>-- No anchor blocks yet --</i></div>
      <div v-else v-for="anchorBlock in dta.anchorBlocks" :key="anchorBlock.uuid" class="anchor">
        <h6 @click="focusAnchorBlock(anchorBlock.anchors)">{{ anchorBlock.uuid }}</h6>
        <details class="settings">
          <summary>Settings</summary>
          <div>
            <input type="color" v-model="anchorBlock.color" />
            <pre contenteditable="true" title="Data">{{ JSON.stringify(anchorBlock.data, null, 2) }}</pre>
            <button @click="(e) => saveAnchorData(anchorBlock, e.target.previousSibling.textContent)" class="saveDataBtn">Save data</button>
            <button @click="destroyAnchorBlock(anchorBlock.uuid)" class="destroyBtn">DESTROY</button>
          </div>
        </details>
        <details class="parts">
          <summary>Anchors ({{ anchorBlock.anchors.length }})</summary>
          <div>
            <div v-for="anchor in anchorBlock.anchors" :key="anchor.uuid" @click="focusAnchorBlock([anchor])">
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
import hotkeys from "hotkeys-js";
import LoremGenerator from "./LoremGenerator.vue";
import DTA from "../../../dist/lib/index.js";

const textfield = ref(null);
const loremXML = ref("");
const useMode = ref(true);
const controlsDisabled = computed(() => (loremXML.value.length === 0 || !useMode.value));
const loadXMLInput = ref(null);
const loadAnchorsInput = ref(null);

let dta = null;
onMounted(() => dta = new DTA(textfield.value));
const forceAnchorsRerenderKey = ref(0);

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
    forceAnchorsRerenderKey.value++;
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
    forceAnchorsRerenderKey.value++;
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
  forceAnchorsRerenderKey.value++;
}

function saveAnchorData(anchorBlock, rawData) {
  try {
    const data = JSON.parse(rawData);
    anchorBlock.data = data;
  } catch (err) {
    console.error(err);
  }
}

function destroyAnchorBlock(uuid) {
  if (!confirm("Really?")) return;
  const anchorBlock = dta.anchorBlocks.find((anchorBlock) => anchorBlock.uuid === uuid);
  dta.destroyAnchorBlocks([anchorBlock]);
  forceAnchorsRerenderKey.value++;
}

function focusAnchorBlock(anchors = []) {
  const focused = [...textfield.value.querySelectorAll("[data-focused]")].map((anchor) => {
    anchor.removeAttribute("data-focused");
    return anchor.dataset.uuid;
  });
  anchors.forEach((anchor) => {
    if (focused.includes(anchor.uuid)) return;
    textfield.value.querySelector(`[data-uuid="${anchor.uuid}"]`).setAttribute("data-focused", "true")
  });
}

document.addEventListener("anchor-click", (e) => {
  console.info(`Anchor #${e.detail.anchor.uuid} has been clicked`);
});

hotkeys("ctrl+m+l, ctrl+m+r", (e, handler) => {
  e.preventDefault();
  if (!/DTA-ANCHOR/i.test(e.target.nodeName)) return;

  for (const anchorBlock of dta.anchorBlocks) {
    for (const anchor of anchorBlock.anchors) {
      if (anchor.uuid === e.target.dataset.uuid) {
        if (handler.key === "ctrl+m+l") anchorBlock.merge("left");
        if (handler.key === "ctrl+m+r") anchorBlock.merge("right");
        forceAnchorsRerenderKey.value++;
        return;
      }
    }
  }
});
</script>