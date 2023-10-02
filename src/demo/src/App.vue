<template>
  <nav>
    <h1>DTA DEMO</h1>
    <a href="https://github.com/Petr-Chalupa" target="_blank">AUTHOR</a>
    <a href="https://github.com/Petr-Chalupa/DynamicTextAnchors" target="_blank">README</a>
  </nav>

  <div id="container">
    <div v-if="!isXML" id="textfield" :contenteditable="editMode" ref="textfield">{{ loremText }}</div>
    <div v-else id="textfield" v-html="loremXML" :contenteditable="editMode" ref="textfield"></div>

    <div id="controls">
      <div id="text-html">
        <p>TEXT</p>
        <label class="switch">
          <input type="checkbox" v-model="isXML" />
          <span class="slider"></span>
        </label>
        <p>XML</p>
      </div>
      <label v-if="isXML" id="depth">
        Maximální zanoření ({{ maxDepth }})
        <input type="range" min="1" max="10" v-model="maxDepth" />
      </label>
      <button @click="generateText">GENERATE</button>
      <button @click="editText">EDIT MANUALLY <span v-if="editMode">✅</span><span v-else>❌</span></button>
      <button @click="createAnchor">CREATE ANCHOR</button>
    </div>

    <div id="anchors">
      <h3>Anchors</h3>
      <div v-for="anchor in anchors" :key="anchor">{{ anchor }}</div>
    </div>
  </div>
</template>

<style lang="scss" src="@/assets/css/main.scss" />

<script setup>
import { ref } from "vue";
//
import { LoremIpsum } from "lorem-ipsum";
const lorem = new LoremIpsum({
  sentencesPerParagraph: { max: 16, min: 3, },
  wordsPerSentence: { max: 9, min: 3, },
});
//
import { DTA } from "../../../dist/index.js";

const textfield = ref(null);
const loremText = ref("");
const loremXML = ref("");
const isXML = ref(false);
const maxDepth = ref(1);
const editMode = ref(false);
const anchors = ref([]);
//
const dta = new DTA();

function randomInt(min = 0, max = 1) { return Math.floor(Math.random() * (max - min + 1)) << 0 }

function genLoremXML(depth = 0) {
  let paragraphs = lorem.generateParagraphs(randomInt(1, Math.round(16 / depth))).split("\n"); // decrease number of <p> with greater depth
  paragraphs = paragraphs.map((p) => {
    if (Math.random() > 0.5 && depth < maxDepth.value) { // 50% chance of creating child <div>
      let sentences = p.split(/[\.\!\?]\s/);
      sentences = sentences.slice(0, randomInt(0, sentences.length)); // random position of child <div> inside parent <div>
      const splitIndex = sentences.join(". ").length + 2; // + 2 because of the ". " after the last sentence
      return `<div><p>${p.substring(0, splitIndex)}</p>${genLoremXML(depth + 1)}<p>${p.substring(splitIndex)}</p></div>`;
    } else return `<p>${p}</p>`;
  });
  return paragraphs.map((p) => p.replaceAll(/\<p\>\s*\<\/p\>/g, "")).join(""); // remove empty <p>
}

function generateText() {
  if (isXML.value) {
    do {
      loremXML.value = genLoremXML();
    } while (loremXML.value === "");
    dta.setText(textfield.value, loremXML.value);
  } else {
    do {
      loremText.value = lorem.generateParagraphs(randomInt(1, 16));
    } while (loremText.value === "");
    dta.setText(textfield.value, loremText.value, false);
  }
}

function editText() {
  editMode.value = !editMode.value;
}

function createAnchor() {
  dta.createAnchor(window.getSelection());

  anchors.value.push("ANCHOR#" + new Date().getTime());
}
</script>