<script setup lang="ts">
import { ref } from "vue";
import {
  mergeSillyTavernLorebooks,
  toCharacterBook,
  toSillyTavernLorebook,
  type AnyLorebook,
} from "./sillytavern";
import { mergeCharacterBooks } from "./characterCard";
import { downloadBlob } from "../../lib/download";

defineProps<{
  allLorebooks: readonly {
    readonly name: string;
    readonly lorebook: AnyLorebook;
  }[];
  defaultChecked: boolean;
}>();
const emit = defineEmits<{
  close: [];
}>();

const lorebooksToMerge = ref(new Set<AnyLorebook>());

const exportMergedAsCcv2 = () => {
  const merged = mergeCharacterBooks(
    Array.from(lorebooksToMerge.value, toCharacterBook),
  );
  downloadBlob(
    new Blob([JSON.stringify(merged)], { type: "application/json" }),
    "merged_lorebook_ccv2.json",
  );
};

const exportMergedAsSillyTavern = () => {
  const merged = mergeSillyTavernLorebooks(
    Array.from(lorebooksToMerge.value, toSillyTavernLorebook),
  );
  downloadBlob(
    new Blob([JSON.stringify(merged)], { type: "application/json" }),
    "merged_lorebook_sillytavern.json",
  );
};
</script>

<template>
  <label class="LorebookEditorMergeTabTitle tab-title">
    <input
      type="radio"
      name="desloppify-tab"
      class="invisible-radio"
      :checked="defaultChecked"
    />
    Merge Lorebooks
    <button class="transition-bg" @click="emit('close')">&times;</button>
  </label>
  <div class="LorebookEditorMergeTabContents tab-contents">
    <div class="lorebook-editor-merge-tab-instructions">
      Select the lorebook files you want to merge:
    </div>
    <div class="lorebook-editor-merge-tab-buttons">
      <button @click="exportMergedAsCcv2">Export (Character Card v2)</button>
      <button @click="exportMergedAsSillyTavern">Export (SillyTavern)</button>
    </div>
    <div class="lorebook-editor-merge-tab-checkboxes">
      <label v-for="file in allLorebooks" :key="file.name">
        <input
          type="checkbox"
          :model-value="lorebooksToMerge.has(file.lorebook)"
          @update:model-value="
            $event
              ? lorebooksToMerge.add(file.lorebook)
              : lorebooksToMerge.delete(file.lorebook)
          "
        />
        {{ file.name }}
      </label>
    </div>
  </div>
</template>

<style scoped>
.LorebookEditorMergeTabContents {
  align-items: center;
}

.lorebook-editor-merge-tab-checkboxes {
  display: flex;
  flex-flow: column;
  background: var(--bg-secondary);
}
</style>
