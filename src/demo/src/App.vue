<template>
  <nav>
    <h1>DTA DEMO</h1>
    <a href="https://github.com/Petr-Chalupa" target="_blank">AUTHOR</a>
    <a href="https://github.com/Petr-Chalupa/DynamicTextAnchors" target="_blank">README</a>
  </nav>

  <div id="container">
    <div id="textfield" v-html="loremXML" :contenteditable="editMode" ref="textfield"></div>

    <div id="controls">
      <div id="text-html">
        <p>USE</p>
        <label class="switch">
          <input type="checkbox" v-model="editMode" />
          <span class="slider"></span>
        </label>
        <p>EDIT</p>
      </div>
      <label id="depth">
        Maximální zanoření ({{ maxDepth }})
        <input type="range" min="1" max="10" v-model="maxDepth" />
      </label>
      <button @click="generateXML">GENERATE</button>
      <button @click="loadAnchors" :disabled="loremXML.length === 0 || editMode">LOAD ANCHORS</button>
      <button @click="saveAnchors" :disabled="loremXML.length === 0 || editMode">SAVE ANCHORS</button>
      <button @click="createAnchor" :disabled="loremXML.length === 0 || editMode">CREATE ANCHOR</button>
    </div>

    <div id="anchors">
      <h3>Anchors</h3>
      <div v-if="anchors.length === 0"><i>-- No anchors yet --</i></div>
      <div v-for="anchor in anchors" :key="anchor">{{ anchor }}</div>
    </div>
  </div>
</template>

<style lang="scss" src="@/assets/scss/main.scss" />

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
const loremXML = ref("");
const maxDepth = ref(5);
const editMode = ref(false);
const anchors = ref([]);
//
const dta = new DTA();

function randomInt(min = 0, max = 1) { return Math.floor(Math.random() * (max - min + 1)) << 0 }

function genLoremXML(depth = 0) { //insert random <b>, <i>... tags (todo)
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
  } while (loremXML.value === "");
  dta.setXML(textfield.value, loremXML.value);
}

function loadAnchors() {
  alert("todo: load anchors from file");
  loremXML.value = dta.loadAnchors();
}

function saveAnchors() {
  alert("todo: save anchors to file");
}

function createAnchor() {
  anchors.value.push(dta.createAnchor(window.getSelection()));
}
</script>