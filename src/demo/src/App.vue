<template>
  <nav>
    <h1>DTA DEMO</h1>
    <a href="https://github.com/Petr-Chalupa" target="_blank">AUTHOR</a>
    <a href="https://github.com/Petr-Chalupa/DynamicTextAnchors" target="_blank">README</a>
  </nav>

  <div id="container">
    <div id="textfield" v-html="loremXML" :contenteditable="!useMode" :key="forceTextfieldRerenderKey" ref="textfield"></div>

    <div id="controls">
      <div id="text-html">
        <p>EDIT</p>
        <label class="switch">
          <input type="checkbox" v-model="useMode" />
          <span class="slider"></span>
        </label>
        <p>USE</p>
      </div>
      <LoremGenerator @genXML="genXML" />
      <button @click="loadAnchors" :disabled="loremXML.length === 0 || !useMode || true">LOAD ANCHORS</button>
      <button @click="saveAnchors" :disabled="loremXML.length === 0 || !useMode || true">SAVE ANCHORS</button>
      <button @click="createAnchorBlock" :disabled="loremXML.length === 0 || !useMode">CREATE ANCHOR</button>
    </div>

    <div id="anchors" :key="forceAnchorsRerenderKey">
      <h3>Anchors</h3>
      <div v-if="dta.anchorBlocks.length === 0"><i>-- No anchors yet --</i></div>
      <div v-for="anchorBlock in dta.anchorBlocks" :key="anchorBlock.value" class="anchor">
        <details class="props">
          <summary>Anchor properties</summary>
          <div>
            <input type="color" v-model="anchorBlock.props.color" />
            <p>Data: {{ anchorBlock.props.data }}</p>
          </div>
        </details>
        <details class="parts">
          <summary>Anchor parts ({{ anchorBlock.anchors.length }})</summary>
          <div>
            <div v-for="{ uuid, value } in anchorBlock.anchors" :key="uuid" @click="highlightAnchor(uuid)">
              <h6>{{ uuid }}</h6>
              <p>{{ value }}</p>
            </div>
          </div>
        </details>
      </div>
    </div>
  </div>
</template>

<style lang="scss" src="@/assets/scss/main.scss" />

<script setup>
import { ref, watch } from "vue";
import { DTA } from "../../../dist/index.js";
import LoremGenerator from "./LoremGenerator.vue";

const textfield = ref(null);
const loremXML = ref("");
const useMode = ref(true);
const forceTextfieldRerenderKey = ref(0);
//
const dta = new DTA();
// const unsavedAnchors = ref(false);
const forceAnchorsRerenderKey = ref(0);
let savedAnchors = null;

watch(useMode, () => {
  // if (!useMode.value && unsavedAnchors.value) saveAnchors();
  if (!useMode.value) savedAnchors = dta.serialize();
  else dta.deserialize(savedAnchors);
});

function genXML(XML) {
  loremXML.value = XML;
  // dta.setXML(textfield.value, XML);
  dta.rootNode = textfield.value;
}

function loadAnchors() {
}

function saveAnchors() {
}

function createAnchorBlock() {
  dta.createAnchorBlock(window.getSelection());
  // unsavedAnchors.value = true;
  forceAnchorsRerenderKey.value++;
}

function highlightAnchor(uuid) {
  const highlightedAnchor = textfield.value.querySelector(".highlighted");
  highlightedAnchor?.classList.remove("highlighted");
  if (highlightedAnchor?.dataset.uuid != uuid) textfield.value.querySelector(`[data-uuid="${uuid}"]`).classList.add("highlighted");
}

document.addEventListener("anchor-click", (e) => {
  console.info(`Anchor #${e.detail.anchor.uuid} has been clicked`);
});
</script>