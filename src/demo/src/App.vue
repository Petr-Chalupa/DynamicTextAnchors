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
      <LoremGenSettings v-model="loremGenSettings" />
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
import { DTA } from "../../../dist/index.js";
import LoremGenSettings from "./LoremGenSettings.vue";
import * as Icon from "./assets/icon.svg";

const loremGenSettings = ref({
  sentencesPerParagraph: { max: 16, min: 3, },
  wordsPerSentence: { max: 9, min: 3, },
  specialTags: {
    text: ["h1", "h2", "h3", "h4", "h5", "h6", "i", "b", "u"],
    nontext: ["img", "audio", "video", "table"],
  }
});
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

function generateXML() {
  const lorem = new LoremIpsum({
    ...loremGenSettings.value.sentencesPerParagraph,
    ...loremGenSettings.value.wordsPerSentence,
  }, "plain", "\n");

  const genRandomTag = (value = "") => {
    let tag = ["p", "div", "span"][randomInt(0, 2)]; // default normal tag
    let isText = true;
    if (randomInt(0, 4) === 0) { // 25% chance for special tag
      if (randomInt(0, 8) === 0) { // 6,25% chance for special non-text tag
        isText = false;
        tag = loremGenSettings.value.specialTags.nontext[randomInt(0, loremGenSettings.value.specialTags.nontext.length - 1)];
      }
      else tag = loremGenSettings.value.specialTags.text[randomInt(0, loremGenSettings.value.specialTags.text.length - 1)];
    }
    return isText ? `<${tag}>${value}</${tag}>` : `<${tag} controls="true" src="${Icon.default}" title="${value}" />`;
  };

  const genLoremXML = (depth = 0) => {
    let paragraphs = lorem.generateParagraphs(randomInt(1, Math.round(16 / depth))).split("\n"); // decrease number of <p> with greater depth
    paragraphs = paragraphs.map((p) => {
      if (Math.random() > 0.5 && depth < maxDepth.value) { // 50% chance of creating child <div>
        let sentences = p.split(/[\.\!\?]\s/);
        sentences = sentences.slice(0, randomInt(0, sentences.length)); // random position of child <div> inside parent
        const splitIndex = sentences.join(". ").length + 2; // + 2 because of the ". " after the last sentence
        return `<div>${genRandomTag(p.substring(0, splitIndex))}${genLoremXML(depth + 1)}${genRandomTag(p.substring(splitIndex))}</div>`;
      } else return p;
    });
    return paragraphs.join("");
  };

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