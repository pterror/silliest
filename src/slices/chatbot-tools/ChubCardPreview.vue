<script setup lang="ts">
import {
  CHUB_TAGS_TO_HIDE,
  chubGetCardByFullPath,
  type ChubCard,
} from "./chub";
import { computed, inject } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { chubQueryOptions } from "./chubQuery";
import { chubProviderKey } from "./chubProvider";
import { useTimeAgo } from "@vueuse/core";
import { chubMarkdownToHtml } from "./chubMarkdown";
import { downloadFile } from "../../lib/download";
import { chubCardToTavernCardFile } from "./chubPngHelpers";
import { jsonParse } from "../../lib/json";
import { chubAddAuthorToUrl, chubAddTopicToUrl } from "./chubHelpers";

const props = defineProps<{
  card: ChubCard;
}>();
const emit = defineEmits<{
  openInFullscreen: [];
  searchByAuthor: [name: string];
  addTopic: [topic: string];
}>();

const configQuery = useQuery(chubQueryOptions("chubFetchEntireConfig", []));
const config = configQuery.data;
const { blurNsfw } = inject(chubProviderKey)!;
const author = computed(() => props.card.fullPath.replace(/[/][\s\S]+/, ""));

const isExplicitNsfw = computed(() => props.card.topics.includes("NSFW"));
const isExplicitNsfl = computed(() => props.card.topics.includes("NSFL"));
const isShadowNsfw = computed(() => false);
const isShadowNsfl = computed(() => false);
const isNsfw = computed(() => isExplicitNsfw.value || isShadowNsfw.value);
const isNsfl = computed(() => isExplicitNsfl.value || isShadowNsfl.value);

const tokenCounts = computed(() => {
  const tokenCountsRaw = props.card.labels?.find(
    (l) => l.title === "TOKEN_COUNTS",
  )?.description;
  if (!tokenCountsRaw) return null;
  const tokenCounts = jsonParse(tokenCountsRaw);
  return tokenCounts;
});

const blurred = computed(
  () =>
    props.card.nsfw_image &&
    (config.value?.configs?.theme?.Default?.blur_nsfw ?? blurNsfw.value),
);
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
    <div class="chub-card-preview-title">
      <h2 :title="card.name">{{ card.name }}</h2>
    </div>
    <div class="chub-card-preview-stats">
      <div>Messages: {{ card.nMessages }}</div>
      <div>Chats: {{ card.nChats }}</div>
      <div>Favorites: {{ card.n_favorites }}</div>
      <div>Public Chats: {{ card.n_public_chats }}</div>
      <div>Downloads: {{ card.starCount }}</div>
    </div>
    <div v-if="tokenCounts" class="chub-card-preview-token-counts">
      <span class="chub-card-preview-token-count-heading">Tokens:</span>
      <div class="chub-card-preview-token-counts-details">
        <div>Perm: {{ card.nTokens }}</div>
        <div>Temp: {{ tokenCounts.first_mes + tokenCounts.mes_example }}</div>
      </div>
    </div>
    <div class="chub-card-preview-metadata-container">
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
            chubGetCardByFullPath(card.fullPath, { full: true })
              .then(chubCardToTavernCardFile)
              .then(downloadFile)
          "
        >
          ⤓
        </button>
        <div>
          by
          <a
            :href="chubAddAuthorToUrl(author)"
            class="button"
            @click="$event.ctrlKey ? false : emit('searchByAuthor', author)"
          >
            {{ author }}
          </a>
        </div>
      </div>
      <div class="chub-card-preview-metadata">
        <span>created {{ useTimeAgo(card.createdAt) }}</span>
        <span>updated {{ useTimeAgo(card.lastActivityAt) }}</span>
      </div>
    </div>
    <div
      class="chub-card-preview-tagline"
      v-html="chubMarkdownToHtml(card.tagline, { unsafe: false })"
    ></div>
    <div class="chub-card-preview-topics">
      <a
        v-if="isNsfw"
        class="chub-card-preview-topic button"
        :href="chubAddTopicToUrl('NSFW')"
        @click="$event.ctrlKey ? emit('addTopic', 'NSFW') : false"
        :title="isShadowNsfw ? 'Shadow NSFW' : 'NSFW'"
      >
        {{ isShadowNsfw ? "(🔥)" : "🔥" }}
      </a>
      <a
        v-if="isNsfl"
        class="chub-card-preview-topic button"
        :href="chubAddTopicToUrl('NSFL')"
        @click="$event.ctrlKey ? emit('addTopic', 'NSFL') : false"
        :title="isShadowNsfl ? 'Shadow NSFL' : 'NSFL'"
      >
        {{ isShadowNsfl ? "(💀)" : "💀" }}
      </a>
      <template v-for="topic in card.topics" :key="topic">
        <a
          v-if="!CHUB_TAGS_TO_HIDE.includes(topic)"
          class="chub-card-preview-topic button"
          :href="chubAddTopicToUrl(topic)"
          @click="$event.ctrlKey ? emit('addTopic', topic) : false"
        >
          {{ topic }}
        </a>
      </template>
    </div>
  </div>
</template>

<style scoped>
.ChubCardPreview {
  display: flex;
  gap: 0.5em;
  flex-flow: column nowrap;
  align-items: center;
}

.chub-card-preview-title {
  display: grid;
  place-items: center;
  font-size: 125%;
  height: 3lh;
}

h2 {
  margin: 0;
  font-size: 100%;
  text-align: center;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
  -webkit-line-clamp: 3;
  line-clamp: 3;
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
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
  -webkit-line-clamp: 10;
  line-clamp: 10;
  place-items: center;
  max-width: 100%;
  overflow-wrap: break-word;
  text-align: center;
  height: 10lh;
  overflow: clip;
  text-overflow: ellipsis;
}

.chub-card-preview-tagline :deep(p) {
  margin: 0;
}

.chub-card-preview-topics {
  display: flex;
  flex-flow: row wrap;
  justify-content: center;
  max-height: 10lh;
  overflow: clip;
  gap: 0.5em;
}

.chub-card-preview-topic {
  cursor: pointer;
  background-color: var(--bg-secondary);
  padding: 0.2em 0.5em;
  border-radius: 4px;
}

.chub-card-preview-metadata-container {
  display: flex;
  flex-flow: column nowrap;
  place-items: center;
}

.chub-card-preview-metadata {
  font-size: 0.9em;
  opacity: 0.7;
}

.chub-card-preview-stats {
  font-size: 0.9em;
  opacity: 0.7;
  display: flex;
  flex-flow: row wrap;
  gap: 0.25em 1em;
  justify-content: center;
}

.chub-card-preview-token-counts {
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  font-size: 0.9em;
  opacity: 0.8;
}

.chub-card-preview-metadata {
  display: flex;
  flex-flow: column nowrap;
  gap: 0.25em;
  align-items: center;
  font-size: 0.9em;
  opacity: 0.7;
}

.chub-card-preview-token-counts-details {
  display: flex;
  flex-flow: row wrap;
  gap: 1em;
  justify-content: center;
}

:deep(img) {
  max-width: 100%;
}
</style>
