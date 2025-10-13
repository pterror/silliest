<script setup lang="ts">
import { decode } from "fast-png";
import exifr from "exifr";
import { computedAsync } from "@vueuse/core";
import { onMounted, onUnmounted, ref, Teleport } from "vue";
import { fileType } from "../../lib/filetype";

const props = defineProps<{
  readonly file: File;
  readonly defaultChecked: boolean;
}>();
const emit = defineEmits<{
  close: [];
}>();

const title = props.file.name;

const fullscreenPreviewVisible = ref(false);

const imageUrl = ref<string | undefined>(undefined);

onMounted(() => {
  imageUrl.value = URL.createObjectURL(props.file);
});

onUnmounted(() => {
  if (!imageUrl.value) return;
  URL.revokeObjectURL(imageUrl.value);
});

function copyMetadata() {
  if (!metadata.value) return;
  navigator.clipboard.writeText(metadata.value);
}

const metadata = computedAsync(() =>
  props.file
    .arrayBuffer()
    .then(async (buffer) => {
      const [, mimetype] = fileType(new Uint8Array(buffer)) ?? [];
      switch (mimetype) {
        case "image/png": {
          const png = decode(buffer);
          return png.text.parameters;
        }
        case "image/jpeg": {
          const exif = await exifr.parse(buffer, ["UserComment"]);
          const userCommentRaw = exif.userComment;
          console.log(
            ":0",
            new TextDecoder("utf-16le").decode(
              userCommentRaw.slice("UNICODE\0\0".length),
            ),
          );
          return userCommentRaw
            ? new TextDecoder().decode(userCommentRaw.slice("UNICODE\0".length))
            : undefined;
        }
        default: {
          throw new Error(`Unsupported file type: ${mimetype ?? "unknown"}`);
        }
      }
    })
    .catch((error) => {
      console.error(
        `Could not decode PNG file '${props.file.name}'`,
        "Error:",
        error,
      );
    }),
);
</script>

<template>
  <label class="SdWebuiInfoTabTitle tab-title">
    <input
      type="radio"
      name="desloppify-tab"
      class="invisible-radio"
      :checked="defaultChecked"
    />
    {{ title }}
    <button class="transition-bg" @click="emit('close')">&times;</button>
  </label>
  <div v-if="metadata" class="SdWebuiInfoTabContents tab-contents">
    <img
      v-if="imageUrl"
      class="image transition-bg darken-on-hover"
      :src="imageUrl"
      @click="fullscreenPreviewVisible = true"
    />
    <h3>Metadata</h3>
    <div class="button-row">
      <button @click="copyMetadata">Copy Metadata</button>
    </div>
    <p class="metadata">{{ metadata }}</p>
  </div>
  <Teleport v-if="fullscreenPreviewVisible && imageUrl" to="body">
    <div
      class="fullscreen-preview transition-bg"
      @click="fullscreenPreviewVisible = false"
    >
      <img :src="imageUrl" @click.stop />
    </div>
  </Teleport>
</template>

<style scoped>
.metadata {
  white-space: pre-wrap;
  word-break: break-word;
}

.image {
  height: 256px;
  margin: 0 auto;
  cursor: pointer;
  border-radius: 0.25em;
}

.fullscreen-preview:hover:not(:has(> *:hover)) {
  cursor: pointer;
  background: var(--bg-darken-darker);
}
</style>
