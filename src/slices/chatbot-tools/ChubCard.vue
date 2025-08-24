<script setup lang="ts">
import { computed, inject } from "vue";
import { CHUB_TAGS_TO_HIDE, type ChubCard } from "./chub";
import { useQuery } from "@tanstack/vue-query";
import { chubQueryOptions } from "./chubQuery";
import { useEventListener } from "@vueuse/core";
import { chubMarkdownToHtml } from "./chubMarkdown";
import { chubProviderKey } from "./chubProvider";

const props = defineProps<{
  card: ChubCard;
}>();
const emit = defineEmits<{
  close: [];
  searchByAuthor: [];
  addTopic: [topic: string];
}>();

const configQuery = useQuery(chubQueryOptions("chubFetchEntireConfig", []));
const config = configQuery.data;
const { blurNsfw, showCustomCss } = inject(chubProviderKey)!;

const author = computed(() => props.card.fullPath.split("/")[0]);

const blurred = computed(
  () =>
    props.card.nsfw_image &&
    (config.value?.configs?.theme?.Default?.blur_nsfw ?? blurNsfw.value),
);

const shouldShowCustomCss = computed(
  () =>
    config.value?.configs?.theme?.Default?.show_custom_css ??
    showCustomCss.value,
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
    <div class="chub-card-topics">
      <template v-for="topic in card.topics" :key="topic">
        <button
          v-if="!CHUB_TAGS_TO_HIDE.includes(topic)"
          class="chub-card-topic"
          @click="emit('addTopic', topic)"
        >
          {{ topic }}
        </button>
      </template>
    </div>
    <button @click="emit('searchByAuthor')">by {{ author }}</button>
    <img
      :src="card.avatar_url"
      class="chub-card-image"
      :class="{ blurred }"
      alt="Card Image"
    />
    <p
      class="chub-card-tagline"
      v-html="chubMarkdownToHtml(card.tagline, { unsafe: true })"
    ></p>
    <p
      v-html="
        chubMarkdownToHtml(card.description, { unsafe: shouldShowCustomCss })
      "
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
  overflow-wrap: break-word;
}

.chub-card-topics {
  display: flex;
  flex-flow: row wrap;
  gap: 0.5em;
}

.chub-card-topic {
  cursor: pointer;
  background-color: var(--bg-secondary);
  padding: 0.2em 0.5em;
  border-radius: 4px;
}
</style>
