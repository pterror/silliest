<script setup lang="ts">
import { ref } from "vue";
import SdWebuiInfoTab from "./SdWebuiInfoTab.vue";
import { useEventListener } from "@vueuse/core";
import { extractUrls } from "../../lib/url";

const files = ref<File[]>([]);

const onFileInput = (event: Event) => {
  if (!(event.currentTarget instanceof HTMLInputElement)) return;
  files.value = [
    ...files.value,
    ...Array.from(event.currentTarget.files ?? []),
  ];
};

const onDropFiles = (event: DragEvent) => {
  console.log(event, [...(event.dataTransfer?.files ?? [])]);
  if (!event.dataTransfer) return;
  files.value = [...files.value, ...(event.dataTransfer.files ?? [])];
};

const onPaste = (event: ClipboardEvent) => {
  if (!event.clipboardData) return;
  files.value = [...files.value, ...(event.clipboardData.files ?? [])];
  for (const item of event.clipboardData.items) {
    if (item.kind !== "string") continue;
    item.getAsString((s) => {
      for (const url of extractUrls(s)) {
        fetch(url)
          .then((response) => response.blob())
          .then((blob) => {
            const f = new File([blob], url.replace(/^.+[/]/, ""), {
              type: blob.type,
            });
            files.value = [...files.value, f];
          });
      }
    });
  }
};

useEventListener(window, "paste", onPaste);
</script>

<template>
  <div class="SdWebuiInfo">
    <div class="inputs">
      <input type="file" multiple @input="onFileInput" />
      <div class="drop-target" @dragover.prevent @drop.prevent="onDropFiles">
        Drop files here (or paste images or URLs)
      </div>
    </div>
    <div class="tab-container">
      <template v-for="file in files" :key="file.name">
        <SdWebuiInfoTab
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
      @drop.prevent="onDropFiles"
    >
      Drop files here (or paste images or URLs)
    </div>
  </div>
</template>

<style scoped>
.SdWebuiInfo {
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
