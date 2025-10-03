<script setup lang="ts">
import { decode, encode } from "fast-png";
import { TavernCard } from "./types";
import { computedAsync } from "@vueuse/core";
import {
  computed,
  onMounted,
  onUnmounted,
  ref,
  Teleport,
  toRaw,
  watchEffect,
} from "vue";
import {
  ALL_LINE_PROCESSORS,
  DEFAULT_LINE_PROCESSORS,
  desloppify,
} from "./desloppify";
import { unsafeEntries } from "../../lib/object";
import { formatError } from "zod";

const props = defineProps<{
  readonly file: File;
  readonly defaultChecked: boolean;
}>();
const emit = defineEmits<{
  close: [];
}>();

const title = computed(() =>
  props.file.name.replace(
    /^main_?|(?:-[0-9a-f]+)?_?(?:desloppified)?_?(?:spec_v2)?[.]png$/gi,
    "",
  ),
);

const newDescriptionEl = ref<HTMLDivElement | undefined>(undefined);
const newTag = ref("");
const processorListVisible = ref(false);
const fullscreenPreviewVisible = ref(false);

const metadata = ref<TavernCard | undefined>(undefined);
const tags = ref<string[]>([]);
const name = ref("");

const cannotSubmitTag = computed(
  () =>
    !newTag.value ||
    tags.value.some(
      (tag) =>
        tag.localeCompare(newTag.value, undefined, { sensitivity: "base" }) ===
        0,
    ),
);
const addTag = () => {
  if (!newTag.value) return;
  tags.value.push(newTag.value);
  newTag.value = "";
};

const imageUrl = ref<string | undefined>(undefined);

onMounted(() => {
  imageUrl.value = URL.createObjectURL(props.file);
});

onUnmounted(() => {
  if (!imageUrl.value) return;
  URL.revokeObjectURL(imageUrl.value);
});

const png = computedAsync(() =>
  props.file
    .arrayBuffer()
    .then((buffer) => decode(buffer))
    .catch((error) => {
      console.error(
        `Could not decode PNG file '${props.file.name}'`,
        "Error:",
        error,
      );
    }),
);

const lineProcessors = ref(structuredClone(DEFAULT_LINE_PROCESSORS));

const setMetadata = (value: TavernCard) => {
  metadata.value = value;
  tags.value = "data" in value ? value.data.tags : [];
  name.value = "data" in value ? value.data.name : value.name;
};

watchEffect(() => {
  try {
    const text = png.value?.text;
    if (!text) return;
    const metadataV2Text = text["chara"];
    if (!metadataV2Text) return;
    // https://github.com/kwaroran/character-card-spec-v3/blob/main/SPEC_V3.md
    // const metadataV3Text = png.text["ccv3"];
    const rawPayload: unknown = JSON.parse(atob(metadataV2Text));
    const metadata = TavernCard.safeParse(rawPayload);
    if (metadata.success) {
      setMetadata(metadata.data);
      return;
    }
    console.error(
      `Could not read metadata of card '${props.file.name}'`,
      "Errors:",
      formatError(metadata.error)._errors,
      metadata.error,
      "Value:",
      rawPayload,
    );
  } catch (error) {
    console.error(
      `Could not read metadata of card '${props.file.name}'`,
      "Error:",
      error,
    );
  }
});

const chubUrl = computed(() => {
  if (!metadata.value || !("data" in metadata.value)) return;
  const path =
    metadata.value.data.extensions.chub?.full_path ??
    metadata.value.data.extensions.chub?.id;
  if (path == null) return;
  return `https://chub.ai/characters/${path}`;
});

const currentDescription = computed(() =>
  !metadata.value
    ? undefined
    : "data" in metadata.value
    ? metadata.value.data.description
    : metadata.value.description,
);

const newDescription = computed(() => {
  const name =
    metadata.value && "data" in metadata.value
      ? metadata.value.data.name
      : metadata.value?.name;
  if (currentDescription.value == null) return;
  return desloppify(currentDescription.value, {
    ...(name !== undefined ? { name } : {}),
    lineProcessors: unsafeEntries(lineProcessors.value).flatMap(([k, v]) =>
      v ? [k] : [],
    ),
  });
});

const openInNewTab = (url: string) => {
  window.open(url, "_blank");
};

const download = () => {
  if (!png.value || !metadata.value) return;
  const newPngValue = structuredClone(toRaw(png.value));
  const newMetadata = structuredClone(toRaw(metadata.value));
  const newDescription = newDescriptionEl.value?.innerText;
  if ("data" in newMetadata) {
    newMetadata.data.tags = tags.value;
    newMetadata.data.name = name.value;
  } else {
    newMetadata.name = name.value;
  }
  if (newDescription !== undefined) {
    if ("data" in newMetadata) {
      newMetadata.data.description = newDescription;
    } else {
      newMetadata.description = newDescription;
    }
    newPngValue.text["chara"] = btoa(
      String.fromCharCode(
        ...new TextEncoder().encode(JSON.stringify(newMetadata)),
      ),
    );
  }
  if ("data" in newMetadata) {
    const characterBook = newMetadata.data.character_book;
    if (characterBook) {
      for (const entry of characterBook.entries) {
        // SillyTavern <-> chub.ai interoperability
        if ("comment" in entry && !("name" in entry)) {
          entry.name = entry.comment;
        } else if ("name" in entry && !("comment" in entry)) {
          entry.comment = entry.name;
        }
      }
    }
  }
  const newBuffer = encode(newPngValue) as Uint8Array<ArrayBuffer>;
  const url = URL.createObjectURL(new Blob([newBuffer]));
  const link = document.createElement("a");
  link.href = url;
  link.download = props.file.name.replace(
    /_?(?:desloppified)?(_?spec_v2)?(?: ?[(][\d\s]*[)])?[.]png/,
    "_desloppified$&",
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
</script>

<template>
  <label class="DesloppifyTabTitle tab-title">
    <input
      type="radio"
      name="desloppify-tab"
      class="invisible-radio"
      :checked="defaultChecked"
    />
    {{ title }}
    <button class="transition-bg" @click="emit('close')">&times;</button>
  </label>
  <div v-if="metadata" class="DesloppifyTabContents tab-contents">
    <img
      v-if="imageUrl"
      class="image transition-bg darken-on-hover"
      :src="imageUrl"
      @click="fullscreenPreviewVisible = true"
    />
    <input class="name-input" v-model="name" type="text" placeholder="Name" />
    <div class="buttons">
      <button @click.stop="download">Download Fixed Card</button>
      <button v-if="chubUrl != null" @click.stop="openInNewTab(chubUrl)">
        Open in Chub
      </button>
    </div>
    <div>
      <button @click="processorListVisible = !processorListVisible">
        ⚙ Processors
      </button>
      <div class="processors" :class="{ visible: processorListVisible }">
        <label v-for="processor in ALL_LINE_PROCESSORS" type="checkbox">
          <input
            type="checkbox"
            :checked="lineProcessors[processor]"
            @input="lineProcessors[processor] = !lineProcessors[processor]"
          />
          {{ processor }}
        </label>
      </div>
    </div>
    <div>
      <span>Tags</span>
      <div class="buttons tags-buttons">
        <div v-for="tag in tags">
          {{ tag }}
          <button @click="tags.splice(tags.indexOf(tag), 1)">&times;</button>
        </div>
        <form>
          <input
            class="new-tag-input"
            type="text"
            size="1"
            placeholder="Add new tag..."
            v-model="newTag"
          />
          <button
            type="submit"
            :disabled="cannotSubmitTag"
            @click.prevent="addTag"
          >
            +
          </button>
        </form>
      </div>
    </div>
    <div class="diff-view">
      <span>Current</span>
      <span>Processed (edits will be saved on download)</span>
      <div class="text-view-container">
        <div class="diff-view-before boxed show-newlines">
          {{ currentDescription }}
        </div>
      </div>
      <div class="text-view-container">
        <div
          ref="newDescriptionEl"
          class="diff-view-after boxed show-newlines"
          contenteditable="true"
        >
          {{ newDescription }}
        </div>
      </div>
    </div>
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
.name-input {
  font-size: 1.25em;
  align-self: center;
}

.diff-view {
  display: grid;
  gap: 1em;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, auto);
}

.text-view-container {
  display: flex;
  flex-flow: column;
  gap: 0.5em;
}

.processors {
  position: absolute;
  display: none;
  flex-flow: column;
  padding: 1em;
  background: var(--bg-secondary-opaque);
  border-radius: 0.5em;
  margin-top: 0.5em;
}

.processors.visible {
  display: flex;
}

.tags-buttons > * {
  background-color: var(--bg-secondary);
  padding: 0.25em;
  border-radius: 0.25em;
  display: flex;
  gap: 0.25em;
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

.new-tag-input {
  width: 12em;
}
</style>
