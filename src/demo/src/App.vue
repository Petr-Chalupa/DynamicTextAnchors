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
      <label id="depth">
        Maximal depth ({{ maxDepth }})
        <input type="range" min="1" max="10" v-model="maxDepth" />
      </label>
      <button @click="generateXML" :disabled="useMode">GENERATE</button>
      <button @click="loadAnchors" :disabled="loremXML.length === 0 || !useMode">LOAD ANCHORS</button>
      <button @click="saveAnchors" :disabled="loremXML.length === 0 || !useMode">SAVE ANCHORS</button>
      <button @click="createAnchorBlock" :disabled="loremXML.length === 0 || !useMode">CREATE ANCHOR</button>
    </div>

    <div id="anchors" :key="forceAnchorsRerenderKey">
      <h3>Anchors</h3>
      <div v-if="dta.anchorBlocks.length === 0"><i>-- No anchors yet --</i></div>
      <div v-for="anchorBlock in dta.anchorBlocks" :key="anchorBlock.value" class="anchor">
        <div v-for="{ uuid, value } in anchorBlock.anchors" :key="uuid" @click="highlightAnchor(uuid)">
          <h6>{{ uuid }}</h6>
          <p>{{ value }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" src="@/assets/scss/main.scss" />

<script setup>
import { ref, watch } from "vue";
import { LoremIpsum } from "lorem-ipsum";
const lorem = new LoremIpsum({
  sentencesPerParagraph: { max: 16, min: 3, },
  wordsPerSentence: { max: 9, min: 3, },
});
import { DTA } from "../../../dist/index.js";

const textfield = ref(null);
const loremXML = ref("");
const maxDepth = ref(5);
const useMode = ref(false);
const forceTextfieldRerenderKey = ref(0);
//
const dta = new DTA();
const unsavedAnchors = ref(false);
const forceAnchorsRerenderKey = ref(0);

watch(useMode, () => {
  if (!useMode.value && unsavedAnchors.value) {
    saveAnchors();
    forceTextfieldRerenderKey.value++;
  }
});

function randomInt(min = 0, max = 1) { return Math.floor(Math.random() * (max - min + 1)) << 0 }

function genLoremXML(depth = 0) { //insert random <b>, <i>, <img>... tags (todo)
  let paragraphs = lorem.generateParagraphs(randomInt(1, Math.round(16 / depth))).split("\n"); // decrease number of <p> with greater depth
  paragraphs = paragraphs.map((p) => {
    if (Math.random() > 0.5 && depth < maxDepth.value) { // 50% chance of creating child <div>
      let sentences = p.split(/[\.\!\?]\s/);
      sentences = sentences.slice(0, randomInt(0, sentences.length)); // random position of child <div> inside parent <div>
      const splitIndex = sentences.join(". ").length + 2; // + 2 because of the ". " after the last sentence
      return `<div><p>${p.substring(0, splitIndex)}</p>${genLoremXML(depth + 1)}<p>${p.substring(splitIndex)}</p></div>`;
    } else return `<p>${p}</p>`;
  });
  return paragraphs.map((p) => p.replaceAll(/\<(p|div)\>\s*\<\/(p|div)\>/g, "")).join(""); // remove empty <p>
}

function generateXML() {
  do {
    loremXML.value = genLoremXML();
  } while (loremXML.value.trim().length === 0);
  dta.setXML(textfield.value, loremXML.value);
}

function loadAnchors() {
  alert("todo: load anchors from file");
  loremXML.value = dta.loadAnchors();
}

function saveAnchors() {
  dta.saveAnchors();
  unsavedAnchors.value = false;
}

function createAnchorBlock() {
  dta.createAnchorBlock(window.getSelection());
  unsavedAnchors.value = true;
  forceAnchorsRerenderKey.value++;
}

function highlightAnchor(uuid) {
  const highlightedAnchor = textfield.value.querySelector(".highlighted");
  highlightedAnchor?.classList.remove("highlighted");
  if (highlightedAnchor?.dataset.uuid != uuid) textfield.value.querySelector(`[data-uuid="${uuid}"]`).classList.add("highlighted");
}
</script>