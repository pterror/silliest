<script setup lang="ts">
import { ref, watch } from "vue";
import ChatTab from "./ChatTab.vue";
import { useEventListener } from "@vueuse/core";
import { extractUrls } from "../../lib/url";
import { useComputedSearchParams } from "../../lib/composables/vueUse.ts";

type ChatFile = { file: File; url?: string };

const files = ref<ChatFile[]>([]);

const {
  params: { "file[]": filesUrls },
} = useComputedSearchParams({
  "file[]": { type: "string[]" },
});

watch(
  filesUrls,
  (urls, _oldUrls, onCleanup) => {
    const activeUrls = new Set(urls);
    const controller = new AbortController();
    onCleanup(() => controller.abort());

    files.value = files.value.filter(
      ({ url }) => url === undefined || activeUrls.has(url),
    );

    for (const url of activeUrls) {
      if (files.value.some((entry) => entry.url === url)) continue;
      fetch(url, { signal: controller.signal })
        .then(async (response) => {
          if (!response.ok) throw new Error(`Failed to fetch ${url}`);
          const blob = await response.blob();
          return new File([blob], url.replace(/^.+[/]/, ""), {
            type: blob.type,
          });
        })
        .then((file) => {
          if (
            !controller.signal.aborted &&
            filesUrls.value.includes(url) &&
            !files.value.some((entry) => entry.url === url)
          ) {
            files.value.push({ file, url });
          }
        })
        .catch((error: unknown) => {
          if (!controller.signal.aborted) console.error(error);
        });
    }
  },
  { immediate: true },
);

const onFileInput = (event: Event) => {
  if (!(event.currentTarget instanceof HTMLInputElement)) return;
  if (!event.currentTarget.files) return;
  files.value.push(
    ...Array.from(event.currentTarget.files, (file) => ({ file })),
  );
};

const processDataTransfer = (dataTransfer: DataTransfer) => {
  files.value.push(...Array.from(dataTransfer.files, (file) => ({ file })));
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
          files.value.push({ file: f });
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
  <div class="Chat">
    <div class="inputs">
      <input type="file" multiple @input="onFileInput" />
      <div class="drop-target" @dragover.prevent @drop.prevent="onDrop">
        Drop files here (or paste log files or URLs)
      </div>
    </div>
    <div class="tab-container">
      <template v-for="entry in files" :key="entry.file.name">
        <ChatTab
          :file="entry.file"
          :default-checked="entry === files[0]"
          @close="files.splice(files.indexOf(entry), 1)"
        />
      </template>
    </div>
    <div
      v-if="files.length === 0"
      class="drop-target"
      @dragover.prevent
      @drop.prevent="onDrop"
    >
      Drop files here (or paste log files or URLs)
    </div>
  </div>
</template>

<style scoped>
.Chat {
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
