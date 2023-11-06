<template>
    <button @click="openDialog">SETTINGS</button>

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

<style lang="scss" scoped src="@/assets/scss/loremGenSettings.scss"></style>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps(["settings"]);
const emits = defineEmits(["update:settings"]);

const settings = computed({
    get() {
        return props.settings;
    },
    set(value) {
        emit("update:settings", value);
    }
});

const dialog = ref(null);

function openDialog() {
    dialog.value.showModal();
}

function closeDialog() {
    dialog.value.close();
}
</script>