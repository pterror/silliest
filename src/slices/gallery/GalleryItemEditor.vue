<script setup lang="ts">
import { computed, ref, watchEffect } from "vue";
import { newEmptyGalleryItem } from "./format";
import type { GalleryItem } from "./types";

const props = defineProps<{ modelValue: GalleryItem }>();
const emit = defineEmits<{ "update:modelValue": [value: GalleryItem] }>();

const item = ref(newEmptyGalleryItem());

const thumbnailUrl = computed(() => item.value.thumbnailUrl || item.value.url);

watchEffect(() => {
  item.value = props.modelValue;
});

watchEffect(() => {
  emit("update:modelValue", item.value);
});
</script>

<template>
  <div class="GalleryItemEditor">
    <div class="metadata-editor boxed">
      <label>
        <span>Title</span>
        <input type="text" name="title" v-model="item.title" />
      </label>
      <label>
        <span>Subtitle</span>
        <input type="text" name="subtitle" v-model="item.subtitle" />
      </label>
      <label>
        <span>URL</span>
        <input type="text" name="url" v-model="item.url" />
      </label>
      <label>
        <span>Thumbnail URL</span>
        <input type="text" name="url" v-model="item.thumbnailUrl" />
      </label>
      <label>
        <span>Author Name</span>
        <input type="text" name="url" v-model="item.authorName" />
      </label>
      <label>
        <span>Author Image</span>
        <input type="text" name="url" v-model="item.authorImage" />
      </label>
      <label>
        <span>Author URL</span>
        <input type="text" name="url" v-model="item.authorUrl" />
      </label>
      <label>
        <span>Description</span>
        <textarea
          type="text"
          name="description"
          v-model="<string | null>(item.description)"
        ></textarea>
      </label>
    </div>
    <img
      v-if="item.authorImage"
      :src="item.authorImage"
      class="author-avatar"
      @click.stop
    />
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
  </div>
</template>

<style scoped>
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

.author-avatar {
  width: 4em;
  height: 4em;
  border-radius: 50%;
  object-fit: cover;
  place-self: center;
}

textarea {
  width: min(calc(100vw - 4em), 64ch);
  height: 6lh;
}

.custom-css-input {
  height: 1lh;
}

@media screen and (max-width: 640px) {
  .metadata-editor {
    grid-template-columns: repeat(1, auto);
  }
}
</style>
