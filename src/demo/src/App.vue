<template>
  <nav>
    <h1>DTA DEMO</h1>
    <a href="https://github.com/Petr-Chalupa" target="_blank">AUTHOR</a>
    <a href="https://www.npmjs.com/package/dynamic-text-anchors?activeTab=readme" target="_blank">README</a>
  </nav>

  <div id="container">
    <div id="textfield" v-html="loremXML" :contenteditable="!useMode" ref="textfield"></div>

    <div id="controls">
      <LoremGenerator @gen-xml="handleGenXML" />
      <label class="button" tabindex="0">
        LOAD XML
        <input type="file" accept="application/xml" @input="loadXML" ref="loadXMLInput" />
      </label>
      <button @click="saveXML" :disabled="controlsDisabled">SAVE XML</button>
      <label class="button" :disabled="controlsDisabled" tabindex="0">
        LOAD ANCHORS
        <input type="file" accept="application/json" @input="loadAnchors" ref="loadAnchorsInput" />
      </label>
      <button @click="saveAnchors" :disabled="controlsDisabled">SAVE ANCHORS</button>
      <button @click="createAnchorBlock" :disabled="controlsDisabled">CREATE ANCHOR</button>
    </div>

    <div v-show="focusedAnchor !== null" id="anchor-details" ref="anchorDetails">
      <div v-if="focusedAnchor !== null">
        <h4 @click="focusAnchorBlock(focusedAnchor.anchorBlock.uuid)">
          AnchorBlock: {{ focusedAnchor.anchorBlock.uuid }}
        </h4>
        <div class="data">
          <input type="color" v-model="focusedAnchor.anchorBlock.color" />
          <pre contenteditable="true" title="Data" ref="dataEditor">{{ JSON.stringify(focusedAnchor.anchorBlock.data, null, 2) }}</pre>
          <button @click="saveAnchorData(focusedAnchor.anchorBlock)" class="saveDataBtn">
            Save data
          </button>
          <p class="merge">
            [{{ focusedAnchor.anchorBlock.canMerge("left") !== null ? "Can" : "Can't" }} merge to left,
            {{ focusedAnchor.anchorBlock.canMerge("right") !== null ? "Can" : "Can't" }} merge to right]
          </p>
        </div>
        <details class="parts">
          <summary>Anchors</summary>
          <div>
            <div v-for="anchor in focusedAnchor.anchorBlock.anchors" :key="anchor.uuid" class="anchor">
              <h6>{{ anchor.uuid }}</h6>
              <p>{{ anchor.value }}</p>
              <p class="changed">
                {{Object.keys(anchor.dataset).find((attr) => attr === "changed")}}
              </p>
            </div>
          </div>
        </details>
      </div>
    </div>
  </div>
</template>

<style lang="scss" src="@/assets/scss/main.scss" />
<style lang="css" src="../../../dist/lib/_styles.css" />

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, type Ref } from "vue";
import LoremGenerator from "./LoremGenerator.vue";

import DTA from "../../../dist/lib/index.js";
import type {
  DTAInstance,
  AnchorBlockInstance,
  AnchorInstance,
  SerializedDTA,
  FocusedAnchorElement,
  FileOperationResult,
  DTAFileData,
  MergeDirection,
  DTAComponentEmits,
  DTAComponentExposed
} from "../../../dist/lib/types.js";

const textfield: Ref<HTMLElement | null> = ref(null);
const loremXML: Ref<string> = ref("");
const useMode: Ref<boolean> = ref(true);
const loadXMLInput: Ref<HTMLInputElement | null> = ref(null);
const loadAnchorsInput: Ref<HTMLInputElement | null> = ref(null);
const anchorDetails: Ref<HTMLElement | null> = ref(null);
const focusedAnchor: Ref<FocusedAnchorElement | null> = ref(null);
const dataEditor: Ref<HTMLPreElement | null> = ref(null);
const controlsDisabled = computed<boolean>(() =>
  loremXML.value.length === 0 || !useMode.value
);

let dta: DTA | null = null;
let anchorFocusObserver: MutationObserver | null = null;

onMounted(() => {
  if (!textfield.value) return;

  dta = new DTA(textfield.value);
  anchorFocusObserver = new MutationObserver((mutationList: MutationRecord[]) => {
    for (const mutation of mutationList) {
      if (mutation.type === "attributes" && mutation.attributeName === "data-focused") {
        const target = mutation.target as HTMLElement;
        if (target.dataset.focused) {
          focusedAnchor.value = target as FocusedAnchorElement;
        }
      }
    }
  });
  anchorFocusObserver.observe(textfield.value, { attributes: true, childList: false, subtree: true });
});

onUnmounted(() => {
  if (anchorFocusObserver) anchorFocusObserver.disconnect();
});

function handleGenXML(xml: string): void {
  loremXML.value = xml;
}

function loadXML(): Promise<FileOperationResult> {
  return new Promise((resolve) => {
    const input = loadXMLInput.value;
    if (!input?.files?.[0]) {
      resolve({ success: false, error: "No file selected" });
      return;
    }

    const file = input.files[0];
    const fileReader = new FileReader();

    fileReader.onload = (event: ProgressEvent<FileReader>) => {
      const result = event.target?.result;
      if (typeof result === "string") {
        loremXML.value = result;
        if (textfield.value) {
          dta = new DTA(textfield.value);
        }
        resolve({ success: true, data: result });
      } else {
        resolve({ success: false, error: "Invalid file content" });
      }
    };

    fileReader.onerror = () => {
      resolve({ success: false, error: "Error reading XML file" });
    };

    fileReader.readAsText(file);
  });
}

function saveXML(): void {
  try {
    const file = new Blob([loremXML.value], { type: "application/xml" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(file);
    link.download = "XML.xml";
    link.click();
  } catch (error) {
    console.error("Error saving XML file:", error);
  }
}

function loadAnchors(): Promise<FileOperationResult> {
  return new Promise((resolve) => {
    const input = loadAnchorsInput.value;
    if (!input?.files?.[0] || !dta) {
      resolve({ success: false, error: "No file selected or DTA not initialized" });
      return;
    }

    const file = input.files[0];
    const fileReader = new FileReader();

    fileReader.onload = (event: ProgressEvent<FileReader>) => {
      const result = event.target?.result;
      if (typeof result === "string") {
        try {
          const parsedData: SerializedDTA = JSON.parse(result);
          dta?.deserialize(parsedData);
          resolve({ success: true, data: parsedData });
        } catch (error) {
          resolve({ success: false, error: "Error parsing anchors JSON" });
        }
      } else {
        resolve({ success: false, error: "Invalid file content" });
      }
    };

    fileReader.onerror = () => {
      resolve({ success: false, error: "Error reading anchors file" });
    };

    fileReader.readAsText(file);
  });
}

function saveAnchors(): void {
  if (!dta) return;

  try {
    const serializedData = dta.serialize();
    const dtaFileData: DTAFileData = {
      version: "1.0",
      created: new Date().toISOString(),
      data: serializedData,
      metadata: {
        anchorBlockCount: serializedData.anchorBlocks.length,
        totalAnchors: serializedData.anchorBlocks.reduce((sum, block) => sum + block.anchors.length, 0)
      }
    };

    const file = new Blob([JSON.stringify(dtaFileData, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(file);
    link.download = "Anchors.json";
    link.click();
  } catch (error) {
    console.error("Error saving anchors:", error);
  }
}

function createAnchorBlock(): void {
  if (!dta) return;

  try {
    dta.createAnchorBlockFromSelection();
  } catch (error) {
    console.error("Error creating anchor block:", error);
  }
}

function focusAnchorBlock(uuid: string): void {
  if (!dta) return;

  try {
    const anchorBlock = dta.anchorBlocks.find((block: AnchorBlock) => block.uuid === uuid);
    if (anchorBlock?.anchors?.[0]) {
      anchorBlock.anchors[0].focus();
    }
  } catch (error) {
    console.error("Error focusing anchor block:", error);
  }
}

function saveAnchorData(anchorBlock: AnchorBlock): void {
  if (!dataEditor.value) return;

  try {
    const rawData = dataEditor.value.textContent || "{}";
    const parsedData = JSON.parse(rawData);
    anchorBlock.data = parsedData;
  } catch (error) {
    console.error("Invalid JSON data:", error);
  }
}

function setupMutationObserver(): void {
  if (!textfield.value) return;

  anchorFocusObserver = new MutationObserver((mutationList: MutationRecord[]) => {
    for (const mutation of mutationList) {
      if (mutation.type === "attributes" && mutation.attributeName === "data-focused") {
        const target = mutation.target as HTMLElement;
        if (target.dataset.focused) {
          focusedAnchor.value = target as FocusedAnchorElement;
        }
      }
    }
  });

  anchorFocusObserver.observe(textfield.value, {
    attributes: true,
    childList: false,
    subtree: true
  });
}

// Utility function to merge anchor blocks programmatically
function mergeAnchorBlocks(sourceUuid: string, direction: MergeDirection): void {
  if (!dta) return;

  const sourceBlock = dta.anchorBlocks.find((block: AnchorBlock) => block.uuid === sourceUuid);
  if (sourceBlock) {
    try {
      sourceBlock.merge(direction);
    } catch (error) {
      console.error(`Error merging anchor block ${direction}:`, error);
    }
  }
} 
</script>