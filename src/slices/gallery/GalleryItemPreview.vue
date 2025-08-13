<script setup lang="ts">
import { computed, ref } from "vue";
import type { GalleryItem } from "./types";
import GalleryItemFull from "./GalleryItemFull.vue";
import { markdownToHtml } from "../../lib/markdown";

const props = defineProps<{ item: GalleryItem }>();
const { item } = props;

const fullscreenViewVisible = ref(false);

const thumbnailUrl = computed(() => item.thumbnailUrl || item.url);
</script>

<template>
  <div class="GalleryItemPreview" @click="fullscreenViewVisible = true">
    <img
      v-if="
        thumbnailUrl ||
        (item.url && (item.type === 'image' || item.type == null))
      "
      :src="thumbnailUrl || ''"
      class="media"
    />
    <video
      v-else-if="item.url && item.type === 'video'"
      :src="item.url"
      class="media"
      controls
    ></video>
    <audio
      v-else-if="item.url && item.type === 'audio'"
      :src="item.url"
      class="media"
      controls
    ></audio>
    <div class="gallery-item-preview-info">
      <span
        v-if="item.title"
        class="gallery-item-preview-title"
        v-html="markdownToHtml(item.title, { unsafe: true })"
      ></span>
      <a
        v-if="item.authorName || item.authorImage"
        v-bind="item.authorUrl ? { href: item.authorUrl } : {}"
        class="gallery-item-preview-author"
      >
        <img
          v-if="item.authorImage"
          class="gallery-item-preview-author-image"
          :src="item.authorImage"
        />
        <span v-if="item.authorName" class="gallery-item-preview-author-name">
          {{ item.authorName }}
        </span>
      </a>
    </div>
  </div>
  <Teleport v-if="fullscreenViewVisible" to="body">
    <GalleryItemFull :item="item" @close="fullscreenViewVisible = false" />
  </Teleport>
</template>

<style scoped>
.GalleryItemPreview {
  position: relative;
  aspect-ratio: 1 / 1;
  cursor: pointer;
}

.media {
  position: absolute;
  aspect-ratio: 16 / 9;
  object-fit: contain;
  max-width: 100%;
  max-height: 100%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.gallery-item-preview-info {
  position: absolute;
  display: flex;
  flex-flow: column nowrap;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 0.5em;
}

.gallery-item-preview-title {
  text-align: center;
}

.gallery-item-preview-author {
  display: flex;
  margin: 0 auto;
  align-items: center;
  gap: 0.5em;
}

.gallery-item-preview-author-image {
  width: 2em;
  height: 2em;
  border-radius: 50%;
  object-fit: cover;
}
</style>
