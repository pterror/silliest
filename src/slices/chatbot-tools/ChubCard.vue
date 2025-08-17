<script setup lang="ts">
import { computed } from "vue";
import type { ChubCard } from "./chub";
import { useQuery } from "@tanstack/vue-query";
import { chubQueryOptions } from "./chubQuery";
import { useEventListener } from "@vueuse/core";
import { chubMarkdownToHtml } from "./chubMarkdown";

const props = defineProps<{
  card: ChubCard;
}>();
const emit = defineEmits<{
  close: [];
  addTopic: [topic: string];
}>();

const configQuery = useQuery(chubQueryOptions("chubFetchEntireConfig", []));
const config = configQuery.data;

const blurred = computed(
  () =>
    props.card.nsfw_image &&
    (config.value?.configs?.theme?.Default?.blur_nsfw ?? true)
);

const showCustomCss = computed(
  () => config.value?.configs?.theme?.Default?.show_custom_css ?? true
);

useEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    emit("close");
  }
});
</script>

<template>
  <div v-if="!card" class="ChubCard">
    <span>Loading...</span>
  </div>
  <div v-else class="ChubCard">
    <div class="top-right-buttons buttons">
      <a
        :href="`https://chub.ai/characters/${card.fullPath}`"
        class="open-in-chub-button button"
        target="_blank"
      >
        Open in Chub
      </a>
      <button class="close-button" @click="emit('close')">&times;</button>
    </div>
    <h1>{{ card.name }}</h1>
    <div class="topics">
      <button
        v-for="topic in card.topics"
        class="topic"
        @click="emit('addTopic', topic)"
      >
        {{ topic }}
      </button>
    </div>
    <img
      :src="card.avatar_url"
      class="chub-card-image"
      :class="{ blurred }"
      alt="Card Image"
    />
    <p
      v-html="chubMarkdownToHtml(card.description, { unsafe: showCustomCss })"
      class="chub-card-description show-newlines"
    ></p>
  </div>
</template>

<style scoped>
.ChubCard {
  display: flex;
  flex-flow: column nowrap;
  padding: 1em;
  gap: 1em;
  align-items: center;
}

.top-right-buttons {
  position: absolute;
  top: 0.5em;
  right: 0.5em;
  border: none;
  border-radius: 4px;
  display: flex;
  flex-flow: row nowrap;
}

.close-button {
  cursor: pointer;
  border-radius: 50%;
  font-size: 1.5em;
}

.open-in-chub-button {
  padding: 0.2em 0.5em;
}

.chub-card-image {
  align-self: center;
}

.chub-card-description {
  max-width: 70ch;
}

.topics {
  display: flex;
  flex-flow: row wrap;
  gap: 0.5em;
}

.topic {
  cursor: pointer;
  background-color: var(--bg-secondary);
  padding: 0.2em 0.5em;
  border-radius: 4px;
}
</style>
