<script setup lang="ts">
import { computed, ref, toRaw, watch, watchEffect } from "vue";
import {
  newEmptyGallery,
  newEmptyGalleryItem,
  parseGalleryFromBase64,
  serializeGalleryToBase64,
} from "./format";
import { computedAsync } from "@vueuse/core";
import GalleryItemEditor from "./GalleryItemEditor.vue";

const gallery = ref(newEmptyGallery());

void parseGalleryFromBase64(location.hash.slice(1)).then(
  (newGallery) => {
    gallery.value = newGallery;
  },
  (error) => {
    console.error(error);
    // Suppress parse failure.
  }
);

const isUrlDirty = ref(false);

const hash = computedAsync(() => serializeGalleryToBase64(gallery.value), "");

watchEffect(() => {
  // Make `hash` a dependency of this effect so it reruns when `gallery` changes.
  hash.value;
  isUrlDirty.value = true;
});

const url = computed(() =>
  new URL(`/gallery#${hash.value}`, location.href).toString()
);

async function checkpoint() {
  if (isUrlDirty.value) {
    history.pushState(null, "", location.href);
    isUrlDirty.value = false;
  }
}

async function goToGalleryPage() {
  location.href = url.value;
}

watchEffect(() => {
  if (location.hash !== `#${hash.value}`) {
    history.replaceState(null, "", `#${hash.value}`);
  }
});
</script>

<template>
  <div class="CreateGallery">
    <div class="navbar">
      <button
        @click="goToGalleryPage"
        class="has-tooltip"
        title="Press back in browser to return here!"
      >
        Go to Gallery
      </button>
      <button
        @click="checkpoint"
        class="has-tooltip"
        title="Press back/forward in browser to navigate between checkpoints"
      >
        Checkpoint
      </button>
    </div>
    <div class="content">
      <div class="metadata-editor boxed">
        <label>
          <span>Title</span>
          <input type="text" name="title" v-model="gallery.title" />
        </label>
        <label>
          <span>Subtitle</span>
          <input type="text" name="subtitle" v-model="gallery.subtitle" />
        </label>
        <label>
          <span>Description</span>
          <textarea
            type="text"
            name="description"
            v-model="<string | null>(gallery.description)"
          ></textarea>
        </label>
      </div>
      <div class="entries-container">
        <h3>Entries</h3>
        <div class="tab-container">
          <template v-for="(item, i) in gallery.items" class="tab-container">
            <label class="tab-title">
              <input
                type="radio"
                name="tab-title"
                class="invisible-radio"
                :checked="item == gallery.items[0]"
              />
              <span v-if="item.title != null">{{ item.title }}</span>
              <span v-else class="faded">(unnamed)</span>
              <button
                class="transition-bg"
                @click="gallery.items.splice(gallery.items.indexOf(item), 1)"
              >
                &times;
              </button>
            </label>
            <GalleryItemEditor
              :modelValue="item"
              @update:modelValue="gallery.items[i] = $event"
              class="tab-contents"
            />
          </template>
          <label class="tab-title">
            <button
              class="transition-bg"
              @click="gallery.items.push(newEmptyGalleryItem())"
            >
              Add new item
            </button>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.CreateGallery {
  display: flex;
  flex-flow: column nowrap;
  width: 100%;
  height: 100%;
}

.content {
  padding: 1em;
  display: flex;
  flex-flow: column nowrap;
  gap: 2em;
}

.metadata-editor {
  display: grid;
  place-self: center;
  place-items: flex-start;
  grid-template-columns: repeat(2, auto);
  gap: 1em;

  label {
    display: contents;
  }
}

.entries-container {
  display: flex;
  flex-flow: column nowrap;
  gap: 1em;
}

textarea {
  width: min(calc(100vw - 4em), 64ch);
  height: 24ch;
}

@media screen and (max-width: 640px) {
  .metadata-editor {
    grid-template-columns: repeat(1, auto);
  }
}
</style>
