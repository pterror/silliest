<script setup lang="ts">
import { computedAsync } from "@vueuse/core";
import { chubFetchEntireConfig, type ChubCard as ChubCardType } from "./chub";
import { computed, ref } from "vue";

const props = defineProps<{
  card: ChubCardType;
}>();
const emit = defineEmits<{
  openInFullscreen: [];
}>();

const config = computedAsync(() => chubFetchEntireConfig());
const blurred = computed(
  () =>
    props.card.nsfw_image &&
    (config.value?.configs.theme.Default?.blur_nsfw ?? true)
);
</script>

<template>
  <div class="ChubCardPreview">
    <img :src="card.avatar_url" :class="{ blurred }" alt="Card Image" />
    <h2>{{ card.name }}</h2>
    <a
      :href="`https://chub.ai/characters/${card.fullPath}`"
      class="open-in-chub-button button"
    >
      Chub
    </a>
  </div>
</template>

<style scoped></style>
