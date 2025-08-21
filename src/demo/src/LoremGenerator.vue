<template>
    <button @click="openDialog">SETTINGS</button>
    <button @click="generateXML">GENERATE</button>

    <dialog ref="dialog">
        <div>
            <label class="section">
                <p>Sentences per paragraph MIN <b>3 - {{ settings.sentencesPerParagraph.max }}</b></p>
                <input type="number" min="3" :max="settings.sentencesPerParagraph.max" v-model.number="settings.sentencesPerParagraph.min" />
                <p>Sentences per paragraph MAX <b>{{ settings.sentencesPerParagraph.min }} - 16</b></p>
                <input type="number" :min="settings.sentencesPerParagraph.min" max="16" v-model.number="settings.sentencesPerParagraph.max" />
            </label>

            <label class="section">
                <p>Words per sentence MIN <b>1 - {{ settings.wordsPerSentence.max }}</b></p>
                <input type="number" min="1" :max="settings.wordsPerSentence.max" v-model.number="settings.wordsPerSentence.min" />
                <p>Words per sentence MAX <b>{{ settings.wordsPerSentence.min }} - 9</b></p>
                <input type="number" :min="settings.wordsPerSentence.min" max="9" v-model.number="settings.wordsPerSentence.max" />
            </label>

            <label class="section">
                <p>Maximal depth <b>1 - 10</b></p>
                <input type="number" min="1" max="10" v-model.number="settings.maxDepth" />
            </label>

            <button @click="closeDialog">CLOSE</button>
        </div>
    </dialog>
</template>

<style lang="scss" scoped src="@/assets/scss/loremGenerator.scss"></style>

<script setup lang="ts">
import { reactive, ref, type Ref } from 'vue';
import { LoremIpsum } from "lorem-ipsum";
import Icon from "./assets/icon.svg?url";
import Audio from "./assets/audio.wav?url";
import Video from "./assets/video.mp4?url";

interface RangeSettings {
    max: number;
    min: number;
}

interface AdditionalTags {
    text: readonly string[];
    special: readonly string[];
}

interface LoremSettings {
    sentencesPerParagraph: RangeSettings;
    wordsPerSentence: RangeSettings;
    maxDepth: number;
    additionalTags: AdditionalTags;
}

type TagType = "img" | "audio" | "video" | "table" | string;

const emits = defineEmits(["gen-xml"]);

const dialog: Ref<HTMLDialogElement | null> = ref(null);
const settings: LoremSettings = reactive({
    sentencesPerParagraph: { max: 16, min: 3 },
    wordsPerSentence: { max: 9, min: 3 },
    maxDepth: 5,
    additionalTags: {
        text: ["h1", "h2", "h3", "h4", "h5", "h6", "i", "b", "u"] as const,
        special: ["img", "audio", "video", "table"] as const,
    }
});

function randomInt(min: number = 0, max: number = 1): number {
    return Math.floor(Math.random() * (max - min + 1));
}

function openDialog() {
    dialog.value?.showModal();
}

function closeDialog() {
    dialog.value?.close();
}

function generateRandomTag(value: string = ""): string {
    if (value.length === 0) {
        const lorem = new LoremIpsum(settings, "plain", "\n");
        value = lorem.generateSentences(1);
    }

    // Default normal tag
    let tag: string = ["p", "div", "span"][randomInt(0, 2)];

    // 25% chance for additional tag
    if (randomInt(0, 3) === 0) {
        // 6.25% chance for special tag
        if (randomInt(0, 3) === 0) {
            tag = settings.additionalTags.special[randomInt(0, settings.additionalTags.special.length - 1)];
        } else {
            tag = settings.additionalTags.text[randomInt(0, settings.additionalTags.text.length - 1)];
        }
    }

    return createTagElement(tag as TagType, value);
}

function createTagElement(tag: TagType, value: string): string {
    switch (tag) {
        case "img":
            return `<${tag} src="${Icon}" title="${value}" />`;
        case "audio":
            return `<${tag} controls="true" src="${Audio}" title="${value}"></${tag}>`;
        case "video":
            return `<${tag} controls="true" src="${Video}" title="${value}"></${tag}>`;
        case "table": {
            const rows = randomInt(2, 5);
            const columns = randomInt(1, 5);
            const lorem = new LoremIpsum(settings, "plain", "\n");

            let tableContent = `<thead><th colspan="${columns}">TABLE #${value.length}</th></thead>`;

            for (let i = 0; i < rows; i++) {
                tableContent += "<tr>";
                for (let j = 0; j < columns; j++) {
                    tableContent += `<td>${lorem.generateWords(randomInt(1, 3))}</td>`;
                }
                tableContent += "</tr>";
            }

            return `<${tag}>${tableContent}</${tag}>`;
        }
        default:
            return `<${tag}>${value}</${tag}>`;
    }
}

function generateLoremXML(depth: number = 0): string {
    const lorem = new LoremIpsum(settings, "plain", "\n");

    // Decrease number of paragraphs with greater depth
    const paragraphCount = randomInt(1, Math.round(16 / (depth + 1)));
    let paragraphs = lorem.generateParagraphs(paragraphCount).split("\n");

    paragraphs = paragraphs.map((paragraph: string) => {
        // 50% chance of creating child div and depth hasn't reached max
        if (Math.random() > 0.5 && depth < settings.maxDepth) {
            const sentences = paragraph.split(/[\.\!\?]\s/);
            const sliceIndex = randomInt(0, sentences.length);
            const slicedSentences = sentences.slice(0, sliceIndex);

            // +2 because of the ". " after the last sentence
            const splitIndex = slicedSentences.join(". ").length + 2;

            const beforeChild = paragraph.substring(0, splitIndex);
            const afterChild = paragraph.substring(splitIndex);

            return `<div>${generateRandomTag(beforeChild)}${generateLoremXML(depth + 1)}${generateRandomTag(afterChild)}</div>`;
        }

        return paragraph;
    });

    return paragraphs.join("");
}

function generateXML(): void {
    let loremXML: string = "";

    do {
        loremXML = generateLoremXML();
    } while (loremXML.trim().length === 0);

    emits("gen-xml", loremXML);
}
</script>