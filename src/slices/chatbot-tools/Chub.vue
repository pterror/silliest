<script setup lang="ts">
import { computed, ref, Teleport } from "vue";
import {
  chubGetCardById,
  chubGetCardsByQuery,
  type ChubCardId,
  type ChubCardQuery,
} from "./chub";
import { computedAsync, useUrlSearchParams } from "@vueuse/core";
import ChubCardPreview from "./ChubCardPreview.vue";
import { unwrapPossibleSingleton } from "../../lib/array";

const query = ref<ChubCardQuery>({ type: "timeline" });

const cards = computedAsync(() => chubGetCardsByQuery(query.value));

// TODO: URL search parameters to control UI state
// e.g. currently visible cards, filters, etc.
const searchParams = useUrlSearchParams();

const fullscreenCardId = computed(() => {
  const possibleCardId = unwrapPossibleSingleton(searchParams["card_id"]);
  return possibleCardId != null
    ? (Number(possibleCardId) as ChubCardId)
    : undefined;
});

const fullscreenCard = computedAsync(() =>
  fullscreenCardId.value
    ? cards.value?.find((card) => card.id === fullscreenCardId.value) ??
      chubGetCardById(fullscreenCardId.value)
    : undefined
);

function setFullscreenCardId(id: ChubCardId | undefined) {
  if (id) {
    searchParams["card_id"] = String(id);
  } else {
    delete searchParams["card_id"];
  }
}
</script>

<template>
  <div class="Chub">
    <div class="chub-cards">
      <ChubCardPreview
        v-for="card in cards"
        :key="card.id"
        :card="card"
        :focused="card.id === fullscreenCardId"
      />
    </div>
  </div>
  <Teleport to="body" v-if="fullscreenCard">
    <ChubCardPreview
      :card="fullscreenCard"
      @close="setFullscreenCardId(undefined)"
    />
  </Teleport>
</template>

<style scoped>
.chub-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1em;
}
</style>
