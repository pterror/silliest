<script setup lang="ts">
import { ref } from "vue";
import LorebookEditorTab from "./LorebookEditorTab.vue";
import { useEventListener } from "@vueuse/core";
import { extractUrls } from "../../lib/url";
import LorebookEditorMergeTab from "./LorebookEditorMergeTab.vue";
import type { AnyLorebook } from "./sillytavern";

const files = ref<File[]>([]);

const lorebooks = ref<
  {
    readonly file: File;
    readonly name: string;
    readonly lorebook: AnyLorebook;
  }[]
>([]);

const addFile = async (file: File) => {
  files.value.push(file);
  const text = await file.text();
  const lorebook = JSON.parse(text) as AnyLorebook;
  lorebooks.value.push({ file, name: file.name, lorebook });
};

const onFileInput = (event: Event) => {
  if (!(event.currentTarget instanceof HTMLInputElement)) return;
  if (!event.currentTarget.files) return;
  for (const file of Array.from(event.currentTarget.files)) {
    addFile(file);
  }
};

const processDataTransfer = (dataTransfer: DataTransfer) => {
  files.value.push(...Array.from(dataTransfer.files));
  const seenUrls = new Set<string>();
  for (const item of Array.from(dataTransfer.items)) {
    if (item.kind !== "string") continue;
    item.getAsString((s) => {
      for (const url of extractUrls(s)) {
        if (seenUrls.has(url)) continue;
        seenUrls.add(url);
        const chubOrCharhubMatch = url.match(
          /https?:\/\/(?:chub\.ai|characterhub\.org)\/lorebooks\/([\w-]+)\/([\w-]+)/,
        );
        if (chubOrCharhubMatch) {
          // TODO:
          // const [, userName, charName] = chubOrCharhubMatch;
          // chubGetCardByFullPath(
          //   `${userName}/${charName}` as ChubLorebookFullPath,
          // ).then(async (chubCard) => {
          //   const lorebook = await chubCardToTavernCardFile(chubCard);
          //   addFile(lorebook);
          // });
        } else {
          fetch(url).then(async (response) => {
            const blob = await response.blob();
            const f = new File([blob], url.replace(/^.+[/]/, ""), {
              type: blob.type,
            });
            addFile(f);
          });
        }
      }
    });
  }
};

const onDrop = (event: DragEvent) => {
  if (!event.dataTransfer) return;
  processDataTransfer(event.dataTransfer);
};

const onPaste = (event: ClipboardEvent) => {
  if (!event.clipboardData) return;
  processDataTransfer(event.clipboardData);
};

useEventListener(window, "paste", onPaste);
</script>

<template>
  <div class="LorebookEditor">
    <div class="inputs">
      <input type="file" multiple @input="onFileInput" />
      <div class="drop-target" @dragover.prevent @drop.prevent="onDrop">
        Drop files here (or paste files or URLs)
      </div>
    </div>
    <div class="tab-container">
      <LorebookEditorMergeTab
        v-if="lorebooks?.length"
        :all-lorebooks="lorebooks"
        default-checked
      />
      <template v-for="lorebook in lorebooks" :key="lorebook.name">
        <LorebookEditorTab
          :name="lorebook.name"
          :default-checked="false"
          v-model="lorebook.lorebook"
          @close="files.splice(files.indexOf(lorebook.file), 1)"
        />
      </template>
    </div>
    <div
      v-if="files.length === 0"
      class="drop-target"
      @dragover.prevent
      @drop.prevent="onDrop"
    >
      Drop files here (or paste files or URLs)
    </div>
  </div>
</template>

<style scoped>
.LorebookEditor {
  display: flex;
  flex-flow: column;
  gap: 1em;
  flex: 1 0 0;
}

input[type="file"] {
  max-width: 40ch;
}

.inputs {
  display: flex;
  gap: 1em;
  min-height: 5em;
  align-items: center;
}

.inputs > .drop-target {
  align-self: stretch;
}

.drop-target {
  display: grid;
  place-items: center;
  flex: 1 0 auto;
  background-color: var(--bg-secondary);
  border-radius: var(--radius-default);
  transition-property: background-color;
  transition-duration: 150ms;

  &:hover {
    background-color: var(--bg-tertiary);
  }
}
</style>
