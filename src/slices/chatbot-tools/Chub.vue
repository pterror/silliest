<script setup lang="ts">
import { computed, onMounted, ref, Teleport, watchEffect } from "vue";
import {
  chubGetCard,
  type ChubCard as ChubCardType,
  type ChubCardFullPath,
  type ChubCardId,
  type ChubCardQuery,
} from "./chub";
import { computedAsync } from "@vueuse/core";
import ChubCardPreview from "./ChubCardPreview.vue";
import {
  unwrapPossibleSingleton,
  wrapPossibleSingleton,
} from "../../lib/array";
import { useQuery } from "@tanstack/vue-query";
import { chubQueryOptions } from "./chubQuery";
import ChubCard from "./ChubCard.vue";
import { useUrlSearchParams } from "../../lib/composables/url";

// TODO: local-only list of topics to hide (e.g. spammy topics like SillyTavern and TAVERN and V2 Alternate greetings)

const searchParams = useUrlSearchParams(undefined, { writeMode: "push" });

const fullscreenCardId = computed(() => {
  const possibleCardId = unwrapPossibleSingleton(searchParams["card_id"]);
  return possibleCardId != null
    ? /^\d+$/.test(possibleCardId)
      ? (Number(possibleCardId) as ChubCardId)
      : (possibleCardId as ChubCardFullPath)
    : undefined;
});

const search = computed({
  get() {
    return unwrapPossibleSingleton(searchParams["search"]) ?? "";
  },
  set(value) {
    if (value) {
      searchParams["search"] = value;
    } else {
      delete searchParams["search"];
    }
  },
});

const author = computed({
  get() {
    return unwrapPossibleSingleton(searchParams["author"]) ?? "";
  },
  set(value) {
    if (value) {
      searchParams["author"] = value;
    } else {
      delete searchParams["author"];
    }
  },
});

const searchValue = ref(search.value);
const authorValue = ref(author.value);

const excludeMine = computed({
  get() {
    return (searchParams["exclude_mine"] ?? "true") === "true";
  },
  set(value) {
    if (value) {
      delete searchParams["exclude_mine"];
    } else {
      searchParams["exclude_mine"] = String(value);
    }
  },
});

const includeForks = computed({
  get() {
    return (searchParams["include_forks"] ?? "true") === "true";
  },
  set(value) {
    if (value) {
      delete searchParams["include_forks"];
    } else {
      searchParams["include_forks"] = String(value);
    }
  },
});

const topics = computed({
  get() {
    return wrapPossibleSingleton(searchParams["topics"]);
  },
  set(value) {
    searchParams["topics"] = value;
  },
});

const query = computed<ChubCardQuery>(() =>
  topics.value.length > 0 ||
  search.value ||
  author.value ||
  excludeMine.value ||
  !includeForks.value
    ? {
        type: "search",
        params: {
          ...(topics.value.length > 0 && { topics: topics.value.join(",") }),
          ...(search.value && { search: search.value }),
          ...(author.value && { username: author.value }),
          ...(!excludeMine.value && { exclude_mine: excludeMine.value }),
          ...(!includeForks.value && { include_forks: includeForks.value }),
        },
      }
    : { type: "timeline" }
);

const title = computed(() => {
  if (query.value.type === "search") {
    const authorString = author.value ? ` by ${author.value}` : "";
    const topicsString = topics.value.length
      ? ` on ${topics.value.join(", ")}`
      : "";
    const searchString = search.value ? ` "${search.value}"` : "";
    return `cards${authorString}${topicsString}${searchString} | chub`;
  }
  return "timeline | chub";
});

watchEffect(() => {
  document.title = title.value;
});

const cardsQuery = useQuery(chubQueryOptions("chubGetCardsByQuery", [query]));
// Avoid loading by keeping the previous data
const cards = ref<readonly ChubCardType[]>();

watchEffect(() => {
  if (cardsQuery.data.value) {
    cards.value = cardsQuery.data.value;
  }
});

watchEffect(() => {
  if (search.value) {
    searchParams["search"] = search.value;
  } else {
    delete searchParams["search"];
  }
});

watchEffect(() => {
  if (author.value) {
    searchParams["author"] = author.value;
  } else {
    delete searchParams["author"];
  }
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

const newTopic = ref("");

function addNewTopic() {
  const topic = newTopic.value.trim();
  if (topic === "") return;
  addTopic(newTopic.value);
  newTopic.value = "";
}

function addTopic(topic: string) {
  if (topics.value.includes(topic)) return;
  topics.value.push(topic);
  topics.value = [...topics.value];
}

function removeTopic(topic: string) {
  if (!topics.value.includes(topic)) return;
  const index = topics.value.indexOf(topic);
  if (index === -1) return;
  topics.value.splice(index, 1);
  topics.value = [...topics.value];
}
</script>

<template>
  <div class="Chub">
    <div v-if="!cards" class="loading">
      <span>Loading...</span>
    </div>
    <div v-else>
      <input
        v-model="searchValue"
        @change="search = searchValue"
        type="text"
        placeholder="Search cards..."
        class="chub-search-input"
      />
      <div class="chub-author">
        <label>Author</label>
        <input
          v-model="authorValue"
          @change="author = authorValue"
          type="text"
          placeholder="Author username"
          class="chub-author-input"
        />
      </div>
      <div class="chub-checkboxes">
        <label>
          <input type="checkbox" v-model="excludeMine" />
          <span>Exclude my cards</span>
        </label>
        <label>
          <input type="checkbox" v-model="includeForks" />
          <span>Include forks</span>
        </label>
      </div>
      <div class="chub-topics">
        <label>Topics</label>
        <div v-for="topic in topics" class="chub-topic">
          <span>
            {{ topic }}
          </span>
          <button @click="removeTopic(topic)">&times;</button>
        </div>
        <div>
          <input
            v-model="newTopic"
            @keyup.enter="addNewTopic"
            placeholder="Add topic"
            :size="1"
            class="chub-topic-input"
          />
          <button @click="addNewTopic">Add</button>
        </div>
      </div>
      <div class="chub-cards">
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

.chub-topics > label {
  font-weight: bold;
}

.chub-topics {
  display: flex;
  flex-flow: row wrap;
  align-items: center;
  gap: 0.5em;
  margin-bottom: 1em;
}

.chub-author {
  display: flex;
  flex-direction: row nowrap;
  gap: 0.5em;

  > input {
    width: 16ch;
  }
}

.chub-topic {
  display: flex;
  align-items: center;
  gap: 0.5em;
  background-color: var(--bg-secondary);
  padding: 0.2em 0.5em;
  border-radius: 4px;
}

.chub-topic-input {
  width: 16ch;
}

.chub-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1em;
}

.chub-checkboxes {
  display: flex;
  flex-flow: row wrap;
  gap: 0.5em;

  > label {
    display: flex;
    align-items: center;
    gap: 0.25em;
  }
}
</style>
