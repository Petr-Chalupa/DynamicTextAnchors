<template>
    <button @click="openDialog">SETTINGS</button>
    <button @click="generateXML">GENERATE</button>

    <dialog ref="dialog">
        <div>
            <label class="slider">
                Sentences per paragraph MIN<b>({{ settings.sentencesPerParagraph.min }})</b>
                <input type="range" min="3" :max="settings.sentencesPerParagraph.max" v-model="settings.sentencesPerParagraph.min" />
                Sentences per paragraph MAX<b>({{ settings.sentencesPerParagraph.max }})</b>
                <input type="range" :min="settings.sentencesPerParagraph.min" max="16" v-model="settings.sentencesPerParagraph.max" />
            </label>
            <label class="slider">
                Words per sentence MIN<b>({{ settings.wordsPerSentence.min }})</b>
                <input type="range" min="1" :max="settings.wordsPerSentence.max" v-model="settings.wordsPerSentence.min" />
                Words per sentence MAX<b>({{ settings.wordsPerSentence.max }})</b>
                <input type="range" :min="settings.wordsPerSentence.min" max="10" v-model="settings.wordsPerSentence.max" />
            </label>
            <label class="slider">
                Maximal depth<b>({{ settings.maxDepth }})</b>
                <input type="range" min="1" max="10" v-model="settings.maxDepth" />
            </label>

            <button @click="closeDialog">CLOSE</button>
        </div>
    </dialog>
</template>

<style lang="scss" scoped src="@/assets/scss/loremGenerator.scss"></style>

<script setup>
import { reactive, ref } from 'vue';
import { LoremIpsum } from "lorem-ipsum";
import * as Icon from "./assets/icon.svg";
import * as Audio from "./assets/audio.wav";
import * as Video from "./assets/video.mp4";

const emits = defineEmits(["genXML"]);
const dialog = ref(null);
const settings = reactive({
    sentencesPerParagraph: { max: 16, min: 3, },
    wordsPerSentence: { max: 9, min: 3, },
    maxDepth: 5,
    additionalTags: {
        text: ["h1", "h2", "h3", "h4", "h5", "h6", "i", "b", "u"],
        special: ["img", "audio", "video", "table"],
    }
});
let loremXML = "";

function openDialog() {
    dialog.value.showModal();
}

function closeDialog() {
    dialog.value.close();
}

function randomInt(min = 0, max = 1) { return Math.floor(Math.random() * (max - min + 1)) << 0 }

function generateXML() {
    const lorem = new LoremIpsum({
        ...settings.sentencesPerParagraph,
        ...settings.wordsPerSentence,
    }, "plain", "\n");

    const genRandomTag = (value = "") => {
        let tag = ["p", "div", "span"][randomInt(0, 2)]; // default normal tag
        if (randomInt(0, 3) === 0) { // 25% chance for additional tag
            if (randomInt(0, 3) === 0) { // 6,25% chance for special tag
                tag = settings.additionalTags.special[randomInt(0, settings.additionalTags.special.length - 1)];
            }
            else tag = settings.additionalTags.text[randomInt(0, settings.additionalTags.text.length - 1)];
        }
        switch (tag) {
            case "img":
                return `<${tag} src="${Icon.default}" title="${value}" />`;
            case "audio":
                return `<${tag} controls="true" src="${Audio.default}" title="${value}"></${tag}>`;
            case "video":
                return `<${tag} controls="true" src="${Video.default}" title="${value}"></${tag}>`;
            case "table": {
                const rows = randomInt(2, 5);
                const columns = randomInt(1, 5);
                let el = `<thead><th colspan="${columns}">TABLE #${value.length}</th></thead>`;
                for (let i = 0; i < rows; i++) {
                    el += "<tr>";
                    for (let j = 0; j < columns; j++) el += `<td>${lorem.generateWords(randomInt(1, 3))}</td>`;
                    el += "</tr>";
                }
                return `<${tag}>${el}</${tag}>`;
            }
            default:
                return `<${tag}>${value}</${tag}>`;
        }
    };

    const genLoremXML = (depth = 0) => {
        let paragraphs = lorem.generateParagraphs(randomInt(1, Math.round(16 / depth))).split("\n"); // decrease number of <p> with greater depth
        paragraphs = paragraphs.map((p) => {
            if (Math.random() > 0.5 && depth < settings.maxDepth) { // 50% chance of creating child <div>
                let sentences = p.split(/[\.\!\?]\s/);
                sentences = sentences.slice(0, randomInt(0, sentences.length)); // random position of child <div> inside parent
                const splitIndex = sentences.join(". ").length + 2; // + 2 because of the ". " after the last sentence
                return `<div>${genRandomTag(p.substring(0, splitIndex))}${genLoremXML(depth + 1)}${genRandomTag(p.substring(splitIndex))}</div>`;
            } else return p;
        });
        return paragraphs.join("");
    };

    do {
        loremXML = genLoremXML();
    } while (loremXML.trim().length === 0);

    emits("genXML", loremXML);
}
</script>