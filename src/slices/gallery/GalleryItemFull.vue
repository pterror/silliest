<script setup lang="ts">
import { ref } from "vue";
import { markdownToHtml } from "../../lib/markdown";
import type { GalleryItem } from "./types";

const props = defineProps<{ item: GalleryItem }>();
const emit = defineEmits<{ close: [] }>();

const { item } = props;

const infoHidden = ref(false);
</script>

<template>
  <div class="GalleryItemFull" @click="emit('close')">
    <img
      v-if="item.url && (item.type === 'image' || item.type == null)"
      :src="item.url"
      class="media"
      @click.stop
    />
    <video
      v-else-if="item.url && item.type === 'video'"
      :src="item.url"
      class="media"
      controls
      @click.stop
    ></video>
    <audio
      v-else-if="item.url && item.type === 'audio'"
      :src="item.url"
      class="media"
      controls
      @click.stop
    ></audio>
    <div class="gallery-item-full-info" :class="{ hidden: infoHidden }">
      <component is="style" v-if="item.customCss">
        {{ item.customCss }}
      </component>
      <a
        v-if="item.authorName || item.authorImage"
        v-bind="item.authorUrl ? { href: item.authorUrl } : {}"
        class="gallery-item-full-author"
      >
        <img
          v-if="item.authorImage"
          class="gallery-item-full-author-image"
          :src="item.authorImage"
        />
        <span v-if="item.authorName" class="gallery-item-full-author-name">{{
          item.authorName
        }}</span>
      </a>
      <h1
        v-if="item.title"
        class="item-title"
        v-html="markdownToHtml(item.title)"
      ></h1>
      <h2
        v-if="item.subtitle"
        class="item-subtitle"
        v-html="markdownToHtml(item.subtitle)"
      ></h2>
      <span
        v-if="item.description"
        class="item-description"
        v-html="markdownToHtml(item.description)"
      ></span>
    </div>
    <button
      class="toggle-visibility-button"
      @click.stop="infoHidden = !infoHidden"
    >
      👁
    </button>
    <button class="close-button" @click="emit('close')">&times;</button>
  </div>
</template>

<style scoped>
.GalleryItemFull {
  position: fixed;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
  background-color: var(--bg-secondary-opaque);

  > * {
    flex: 1 0 0;
  }
}

.media {
  position: absolute;
}

.gallery-item-full-info {
  position: absolute;
  padding: 1em;
  padding-top: 3em;
  background-color: var(--bg-darken);
}

.toggle-visibility-button {
  position: absolute;
  top: 10px;
  left: 10px;
  background: none;
  border: none;
  font-size: 1.5em;
  border-radius: 50%;
  cursor: pointer;
}

.close-button {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 1.5em;
  border-radius: 50%;
  cursor: pointer;
}

.gallery-item-full-info.hidden ~ .close-button {
  display: none;
}

.gallery-item-full-author {
  display: flex;
  margin: 0 auto;
  align-items: center;
  gap: 0.5em;
}

.gallery-item-full-author-image {
  width: 2em;
  height: 2em;
  border-radius: 50%;
  object-fit: cover;
}
</style>
