<script setup lang="ts">
import { CHUB_TAGS_TO_HIDE, type ChubCard } from "./chub";
import { computed, inject } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { chubQueryOptions } from "./chubQuery";
import { chubProviderKey } from "./chubProvider";
import { useTimeAgo } from "@vueuse/core";
import { chubMarkdownToHtml } from "./chubMarkdown";
import { downloadExternalLinkWithoutContentDisposition } from "../../lib/download";

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

const createdTimeAgo = useTimeAgo(props.card.createdAt);
</script>

<template>
  <div class="ChubCardPreview">
    <div class="chub-card-preview-image-container">
      <img
        :src="card.avatar_url"
        class="chub-card-preview-image transition-filter"
        :class="{ 'blurred-medium': blurred }"
        alt="Card Image"
        @click="emit('openInFullscreen')"
      />
    </div>
    <h2>{{ card.name }}</h2>
    <div
      class="chub-card-preview-tagline"
      v-html="chubMarkdownToHtml(card.tagline, { unsafe: true })"
    ></div>
    <div class="chub-card-preview-topics">
      <template v-for="topic in card.topics" :key="topic">
        <button
          v-if="!CHUB_TAGS_TO_HIDE.includes(topic)"
          class="chub-card-preview-topic"
          @click="emit('addTopic', topic)"
        >
          {{ topic }}
        </button>
      </template>
    </div>
    <div class="buttons">
      <a
        :href="`https://chub.ai/characters/${card.fullPath}`"
        class="open-in-chub"
        target="_blank"
      >
        Chub
      </a>
      <button
        class="chub-card-preview-download-button"
        @click="
          downloadExternalLinkWithoutContentDisposition(
            `https://avatars.charhub.io/avatars/${card.fullPath}/chara_card_v2.png`,
            `main_${card.fullPath.replace(/.+[/]/, '')}_spec_v2.png`,
          )
        "
      >
        ⤓
      </button>
      <div>
        by <button @click="emit('searchByAuthor')">{{ author }}</button>
      </div>
    </div>
    <div class="chub-card-preview-metadata">created {{ createdTimeAgo }}</div>
  </div>
</template>

<style scoped>
.ChubCardPreview {
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
}

h2 {
  text-align: center;
}

.chub-card-preview-image-container {
  width: 200px;
  height: 200px;
  overflow: hidden;
  border-radius: var(--radius-default);
}

.chub-card-preview-image {
  cursor: pointer;
  height: 200px;
  width: 200px;

  &:hover {
    filter: blur(0) brightness(0.8);
  }
}

.chub-card-preview-tagline {
  max-width: 100%;
  overflow-wrap: break-word;
  text-align: center;
}

.chub-card-preview-topics {
  display: flex;
  flex-flow: row wrap;
  justify-content: center;
  gap: 0.5em;
}

.chub-card-preview-topic {
  cursor: pointer;
  background-color: var(--bg-secondary);
  padding: 0.2em 0.5em;
  border-radius: 4px;
}

.chub-card-preview-metadata {
  font-size: 0.9em;
  opacity: 0.7;
}

:deep(img) {
  max-width: 100%;
}
</style>
