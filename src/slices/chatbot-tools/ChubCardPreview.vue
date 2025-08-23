<script setup lang="ts">
import type { ChubCard } from "./chub";
import { computed, inject } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { chubQueryOptions } from "./chubQuery";
import { chubProviderKey } from "./chubProvider";

const props = defineProps<{
  card: ChubCard;
}>();
const emit = defineEmits<{
  openInFullscreen: [];
  searchByAuthor: [];
  addTopic: [topic: string];
}>();

const configQuery = useQuery(chubQueryOptions("chubFetchEntireConfig", []));
const config = configQuery.data;
const { blurNsfw } = inject(chubProviderKey)!;
const author = computed(() => props.card.fullPath.split("/")[0]);

const blurred = computed(
  () =>
    props.card.nsfw_image &&
    (config.value?.configs?.theme?.Default?.blur_nsfw ?? blurNsfw.value),
);
</script>

<template>
  <div class="ChubCardPreview">
    <img
      :src="card.avatar_url"
      class="chub-card-preview-image transition-filter"
      :class="{ blurred }"
      alt="Card Image"
      @click="emit('openInFullscreen')"
    />
    <h2>{{ card.name }}</h2>
    <div class="topics">
      <button
        v-for="topic in card.topics"
        class="topic"
        @click="emit('addTopic', topic)"
      >
        {{ topic }}
      </button>
    </div>
    <div>
      <a
        :href="`https://chub.ai/characters/${card.fullPath}`"
        class="open-in-chub-button button"
        target="_blank"
      >
        Chub
      </a>
      <button @click="emit('searchByAuthor')">{{ author }}</button>
    </div>
  </div>
</template>

<style scoped>
.ChubCardPreview {
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
}

.chub-card-preview-image {
  cursor: pointer;
  border-radius: var(--radius-default);
  height: 200px;
  width: 200px;

  &:hover {
    filter: brightness(0.8);
  }
}

.topics {
  display: flex;
  flex-flow: row wrap;
  justify-content: center;
  gap: 0.5em;
}

.topic {
  cursor: pointer;
  background-color: var(--bg-secondary);
  padding: 0.2em 0.5em;
  border-radius: 4px;
}
</style>
