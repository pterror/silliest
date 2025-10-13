<script setup lang="ts">
import { ref, Teleport } from "vue";

defineProps<{
  fileName: string;
  metadata: string;
  imageUrl: string | undefined;
  defaultChecked: boolean;
}>();
const emit = defineEmits<{
  close: [];
}>();

const fullscreenPreviewVisible = ref(false);

const copy = (text: string) => {
  navigator.clipboard.writeText(text);
};
</script>

<template>
  <label class="SdWebuiInfoTabTitle tab-title">
    <input
      type="radio"
      name="desloppify-tab"
      class="invisible-radio"
      :checked="defaultChecked"
    />
    {{ fileName }}
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
      <button @click="copy(metadata)">Copy Metadata</button>
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
