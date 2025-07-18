<script setup lang="ts">
import { decode, encode } from "fast-png";
import { TavernCard, TavernCardV1, TavernCardV2 } from "./types";
import { validate, validationErrors } from "../../lib/types";
import { computedAsync } from "@vueuse/core";
import { computed, ref, toRaw, watchEffect } from "vue";
import {
  ALL_LINE_PROCESSORS,
  DEFAULT_LINE_PROCESSORS,
  desloppify,
} from "./desloppify";
import { unsafeEntries } from "../../lib/object";

const props = defineProps<{ file: File }>();

const title = computed(() =>
  props.file.name.replace(
    /^main_?|(?:-[0-9a-f]+)?_?(?:desloppified)?_?(?:spec_v2)?[.]png$/gi,
    ""
  )
);

const png = computedAsync(() =>
  props.file.arrayBuffer().then((buffer) => decode(buffer))
);

const lineProcessors = ref(structuredClone(DEFAULT_LINE_PROCESSORS));

const metadata = ref<TavernCard | undefined>(undefined);

watchEffect(() => {
  try {
    const text = png.value?.text;
    if (!text) return;
    const metadataV2Text = text["chara"];
    if (!metadataV2Text) return;
    // https://github.com/kwaroran/character-card-spec-v3/blob/main/SPEC_V3.md
    // const metadataV3Text = png.text["ccv3"];
    const rawPayload: unknown = JSON.parse(atob(metadataV2Text));
    if (validate(TavernCardV1, rawPayload)) {
      metadata.value = rawPayload;
      return;
    }
    if (validate(TavernCardV2, rawPayload)) {
      metadata.value = rawPayload;
      return;
    }
    const errors = validationErrors(TavernCardV2, rawPayload);
    console.error(
      `Could not read metadata of card '${props.file.name}'`,
      "Errors:",
      [...errors],
      "Value:",
      rawPayload
    );
  } catch {}
});

const beforeDescription = computed(() =>
  !metadata.value
    ? undefined
    : "data" in metadata.value
    ? metadata.value.data.description
    : metadata.value.description
);

const afterDescription = computed(() =>
  beforeDescription.value != null
    ? desloppify(beforeDescription.value, {
        lineProcessors: unsafeEntries(lineProcessors.value).flatMap(([k, v]) =>
          v ? [k] : []
        ),
      })
    : undefined
);

const download = () => {
  if (!png.value || !metadata.value) return;
  const newPngValue = structuredClone(toRaw(png.value));
  const newMetadata = structuredClone(toRaw(metadata.value));
  if (afterDescription.value !== undefined) {
    if ("data" in newMetadata) {
      newMetadata.data.description = afterDescription.value;
    } else {
      newMetadata.description = afterDescription.value;
    }
    newPngValue.text["chara"] = btoa(
      String.fromCharCode(
        ...new TextEncoder().encode(JSON.stringify(newMetadata))
      )
    );
  }
  const newBuffer = encode(newPngValue);
  const url = URL.createObjectURL(new Blob([newBuffer]));
  const link = document.createElement("a");
  link.href = url;
  link.download = props.file.name.replace(
    /_?(?:desloppified)?(_?spec_v2)?(?: ?[(][\d\s]*[)])[.]png/,
    "_desloppified$&"
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
</script>

<template>
  <div v-if="metadata" class="DesloppifyTab">
    <div>{{ title }}</div>
    <div>
      <button @click.stop="download">Download Fixed Card</button>
    </div>
    <details>
      <summary>Line Processors</summary>
      <div class="processors">
        <label v-for="processor in ALL_LINE_PROCESSORS" type="checkbox">
          <input
            type="checkbox"
            :checked="lineProcessors[processor]"
            @input="lineProcessors[processor] = !lineProcessors[processor]"
          />
          {{ processor }}
        </label>
      </div>
    </details>
    <div class="diff-view">
      <div class="text-view diff-view-before" contenteditable="true">
        {{ beforeDescription }}
      </div>
      <div class="text-view diff-view-after" contenteditable="true">
        {{ afterDescription }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.DesloppifyTab {
  display: flex;
  flex-flow: column;
  gap: 1em;
}

.diff-view {
  display: flex;
  gap: 1em;
}

.text-view {
  border: 1px solid currentColor;
  border-radius: 0.5em;
  padding: 1em;
  white-space: pre-line;
}

.processors {
  display: flex;
  flex-flow: column;
}
</style>
