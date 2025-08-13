<script setup lang="ts">
import { computedAsync } from "@vueuse/core";
import { parseGalleryFromBase64 } from "./format";
import { computed, ref, watchEffect } from "vue";
import GalleryItemPreview from "./GalleryItemPreview.vue";
import { markdownToHtml } from "../../lib/markdown";
import { getMessageOrToString } from "../../lib/error";

const error = ref<string>();

const gallery = computedAsync(() =>
  parseGalleryFromBase64(location.hash.slice(1)).catch((galleryLoadError) => {
    error.value = getMessageOrToString(galleryLoadError);
    return null;
  })
);

watchEffect(() => {
  document.title = gallery.value?.title ?? "gallery";
});

const showEditButton = computed(
  () => new URLSearchParams(location.search).get("edit") === "true"
);

function goToEditPage() {
  if (gallery.value) {
    const editUrl = new URL(
      `/gallery/create#${location.hash.slice(1)}`,
      location.href
    );
    history.pushState(null, "", editUrl.toString());
  }
}
</script>

<template>
  <div v-if="gallery" class="Gallery">
    <div class="gallery-info">
      <h1
        v-if="gallery.title"
        class="gallery-title"
        v-html="markdownToHtml(gallery.title, { unsafe: true })"
      ></h1>
      <h2
        v-if="gallery.subtitle"
        class="gallery-subtitle"
        v-html="markdownToHtml(gallery.subtitle, { unsafe: true })"
      ></h2>
      <span
        v-if="gallery.description"
        class="gallery-description"
        v-html="markdownToHtml(gallery.description, { unsafe: true })"
      ></span>
    </div>
    <button v-if="showEditButton" class="edit-button" @click="goToEditPage">
      🖉 Edit
    </button>
    <div class="gallery-items">
      <GalleryItemPreview
        v-for="(item, i) in gallery.items"
        :key="i"
        :item="item"
      />
    </div>
  </div>
  <div v-else-if="error" class="Gallery error">
    <div>
      <p>Error loading gallery:</p>
      <p>{{ error }}</p>
    </div>
  </div>
  <div v-else class="Gallery loading">
    <p>Loading gallery...</p>
  </div>
</template>

<style scoped>
.Gallery {
  display: flex;
  flex-flow: column nowrap;
  width: 100%;
  height: 100%;

  &.loading,
  &.error {
    display: grid;
    place-items: center;
    text-align: center;
  }
}

.gallery-info {
  align-self: center;
  max-width: 70ch;
}

.gallery-title,
.gallery-subtitle {
  text-align: center;
}

.gallery-items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1em;
  padding: 1em;
}

.edit-button {
  position: fixed;
  top: 10px;
  right: 10px;
  padding: 5px 10px;
  background-color: var(--bg-secondary);
  border: none;
  border-radius: 5px;
  cursor: pointer;
}
</style>
