<script setup lang="ts">
import { ref } from "vue";
import ComfyuiInfoTab from "./ComfyuiInfoTab.vue";
import { useEventListener } from "@vueuse/core";
import { extractUrls } from "../../lib/url";

const files = ref<File[]>([]);

const onFileInput = (event: Event) => {
  if (!(event.currentTarget instanceof HTMLInputElement)) return;
  if (!event.currentTarget.files) return;
  files.value.push(...Array.from(event.currentTarget.files));
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
        fetch(url).then(async (response) => {
          const blob = await response.blob();
          const f = new File([blob], url.replace(/^.+[/]/, ""), {
            type: blob.type,
          });
          files.value.push(f);
        });
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
  <div class="ComfyuiInfo">
    <div class="inputs">
      <input type="file" multiple @input="onFileInput" />
      <div class="drop-target" @dragover.prevent @drop.prevent="onDrop">
        Drop files here (or paste images or URLs)
      </div>
    </div>
    <div class="tab-container">
      <template v-for="file in files" :key="file.name">
        <ComfyuiInfoTab
          :file="file"
          :default-checked="file === files[0]"
          @close="files.splice(files.indexOf(file), 1)"
        />
      </template>
    </div>
    <div
      v-if="files.length === 0"
      class="drop-target"
      @dragover.prevent
      @drop.prevent="onDrop"
    >
      Drop files here (or paste images or URLs)
    </div>
  </div>
</template>

<style scoped>
.ComfyuiInfo {
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
