<template>
  <nav>
    <h1>DTA DEMO</h1>
    <a href="https://github.com/Petr-Chalupa" target="_blank">AUTHOR</a>
    <a href="https://github.com/Petr-Chalupa/DynamicTextAnchors" target="_blank">README</a>
  </nav>

  <div id="container">
    <div v-if="!isHTML" id="textfield">{{ text }}</div>
    <div v-else id="textfield" v-html="html"></div>

    <div id="controls">
      <div id="text-html">
        <p>TEXT</p>
        <label class="switch">
          <input type="checkbox" v-model="isHTML" />
          <span class="slider"></span>
        </label>
        <p>HTML</p>
      </div>
      <button @click="editText">EDIT MANUALLY</button>
      <button @click="generateText">GENERATE</button>
    </div>
  </div>
</template>

<style lang="scss" src="@/assets/css/main.scss" />

<script setup>
import { ref } from "vue";
import { LoremIpsum } from "lorem-ipsum";
//
import { hello } from "../../../dist/index.js";

hello();

const isHTML = ref(false);
const text = ref("Lorem ipsum dolor sit amet...");
const html = ref("<p>Lorem ipsum dolor sit amet...</p>");

function editText() { }

function generateText() {
  const randomInt = (min = 0, max = 1) => Math.floor(Math.random() * (max - min + 1)) << 0;

  const lorem = new LoremIpsum({
    sentencesPerParagraph: {
      max: 16,
      min: 3,
    },
    wordsPerSentence: {
      max: 9,
      min: 3,
    },
  });

  //edit text to html if isHTML===true

  text.value = lorem.generateParagraphs(randomInt(1, 16));
}
</script>