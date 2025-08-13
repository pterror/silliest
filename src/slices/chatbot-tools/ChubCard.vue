<script setup lang="ts">
import { computed, ref } from "vue";
import { markdownToHtml } from "../../lib/markdown";
import { chubFetchEntireConfig, type ChubCard } from "./chub";
import { computedAsync } from "@vueuse/core";

const props = defineProps<{
  card: ChubCard;
}>();

// FIXME: deduplicate queries globally
const config = computedAsync(() => chubFetchEntireConfig());
const showCustomCss = computed(
  () => config.value?.configs.theme.Default?.show_custom_css ?? false
);
</script>

<template>
  <div v-if="!card" class="ChubCardPreview">
    <span>Loading...</span>
  </div>
  <div v-else>
    <a
      :href="`https://chub.ai/characters/${card.fullPath}`"
      class="open-in-chub-button button"
    >
      Open in Chub
    </a>
    <h1>{{ card.name }}</h1>
    <p>
      {{ markdownToHtml(card.description, { unsafe: showCustomCss }) }}
    </p>
  </div>
</template>

<style scoped>
.open-in-chub-button {
  position: absolute;
  top: 0.5em;
  right: 0.5em;
}
</style>
