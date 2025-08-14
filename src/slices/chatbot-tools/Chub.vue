<script setup lang="ts">
import { computed, ref, Teleport } from "vue";
import {
  chubGetCard,
  chubGetCardById,
  type ChubCardFullPath,
  type ChubCardId,
  type ChubCardQuery,
} from "./chub";
import { computedAsync, useUrlSearchParams } from "@vueuse/core";
import ChubCardPreview from "./ChubCardPreview.vue";
import { unwrapPossibleSingleton } from "../../lib/array";
import { useQuery } from "@tanstack/vue-query";
import { chubQueryOptions } from "./chubQuery";
import ChubCard from "./ChubCard.vue";

const query = ref<ChubCardQuery>({ type: "timeline" });

const cardsQuery = useQuery(
  chubQueryOptions("chubGetCardsByQuery", [query.value])
);
const cards = cardsQuery.data;

// TODO: URL search parameters to control UI state
// e.g. currently visible cards, filters, etc.
const searchParams = useUrlSearchParams();

const fullscreenCardId = computed(() => {
  const possibleCardId = unwrapPossibleSingleton(searchParams["card_id"]);
  return possibleCardId != null
    ? /^\d+$/.test(possibleCardId)
      ? (Number(possibleCardId) as ChubCardId)
      : (possibleCardId as ChubCardFullPath)
    : undefined;
});

const fullscreenCard = computedAsync(() =>
  fullscreenCardId.value
    ? cards.value?.find((card) => card.id === fullscreenCardId.value) ??
      chubGetCard(fullscreenCardId.value)
    : undefined
);

function setFullscreenCardId(id: ChubCardId | ChubCardFullPath | undefined) {
  if (id) {
    searchParams["card_id"] = String(id);
  } else {
    delete searchParams["card_id"];
  }
}

function addTopic(topic: string) {
  if (query.value.type !== "search") {
    query.value = { type: "search", params: {} };
  }
  const topics = new Set(query.value.params.topics?.split(",") ?? []);
  topics.add(topic);
  query.value.params.topics = [...topics].join(",");
}
</script>

<template>
  <div class="Chub">
    <div v-if="!cards" class="loading">
      <span>Loading...</span>
    </div>
    <div v-else class="chub-cards">
      <ChubCardPreview
        v-for="card in cards"
        :key="card.id"
        :card="card"
        :focused="card.id === fullscreenCardId"
        @openInFullscreen="setFullscreenCardId(card.fullPath)"
        @addTopic="addTopic"
      />
    </div>
  </div>
  <Teleport to="body" v-if="fullscreenCard">
    <div class="fullscreen">
      <ChubCard
        :card="fullscreenCard"
        @close="setFullscreenCardId(undefined)"
      />
    </div>
  </Teleport>
</template>

<style scoped>
.Chub {
  width: 100%;
  height: 100%;
}

.loading {
  font-size: 1.5em;
}

.chub-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1em;
}
</style>
