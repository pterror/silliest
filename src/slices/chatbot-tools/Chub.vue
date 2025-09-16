<script setup lang="ts">
import { computed, provide, ref, Teleport, watchEffect } from "vue";
import {
  chubGetCard,
  type ChubCard as ChubCardType,
  type ChubCardFullPath,
  type ChubCardId,
  type ChubCardQuery,
  CHUB_SORT_TYPES,
  CHUB_CARD_QUERY_TYPES,
} from "./chub";
import { useLocalStorage, useUrlSearchParams } from "@vueuse/core";
import ChubCardPreview from "./ChubCardPreview.vue";
import { narrowingIncludes, unwrapPossibleSingleton } from "../../lib/array";
import { useQuery } from "@tanstack/vue-query";
import { chubQueryOptions } from "./chubQuery";
import ChubCard from "./ChubCard.vue";
import { chubProviderKey } from "./chubProvider";
import ChubSortDropdown from "./ChubSortDropdown.vue";
import {
  computedArraySearchParameter,
  computedBooleanSearchParameter,
  computedSearchParameter,
} from "../../lib/composables/vueUse";

// TODO: local-only list of topics to hide (e.g. spammy topics like SillyTavern and TAVERN and V2 Alternate greetings)

const searchParams = useUrlSearchParams(undefined, { writeMode: "push" });

const username = useLocalStorage("chub-placeholder-username", "User");
const avatarUrl = useLocalStorage(
  "chub-placeholder-avatar",
  "https://sillie.st/3c.png",
);
const blurNsfw = useLocalStorage("chub-blur-nsfw", true);
const showCustomCss = useLocalStorage("chub-show-custom-css", true);

provide(chubProviderKey, {
  username,
  avatarUrl,
  blurNsfw,
  showCustomCss,
});

const fullscreenCardId = computedSearchParameter({
  searchParams,
  name: "card_id",
  defaultValue: undefined,
  sanitize: (value) => {
    const possibleCardId = unwrapPossibleSingleton(value);
    return possibleCardId != null
      ? /^\d+$/.test(possibleCardId)
        ? (Number(possibleCardId) as ChubCardId)
        : (possibleCardId as ChubCardFullPath)
      : undefined;
  },
});

const page = computedSearchParameter({
  searchParams,
  name: "page",
  defaultValue: 1,
  sanitize: (value) => Number(unwrapPossibleSingleton(value)) || 1,
});

const search = computedSearchParameter({
  searchParams,
  name: "search",
  defaultValue: "",
  sanitize: (value) => unwrapPossibleSingleton(value) ?? "",
  onSet: () => {
    page.value = 1;
  },
});

const author = computedSearchParameter({
  searchParams,
  name: "author",
  defaultValue: "",
  sanitize: (value) => unwrapPossibleSingleton(value) ?? "",
  onSet: () => {
    page.value = 1;
  },
});

const searchValue = ref(search.value);
const authorValue = ref(author.value);

const queryType = computedSearchParameter({
  searchParams,
  name: "query_type",
  defaultValue: "search",
  sanitize: (value) =>
    narrowingIncludes(CHUB_CARD_QUERY_TYPES, value) ? value : "search",
  onSet: () => {
    page.value = 1;
  },
});

const isTimeline = computed({
  get() {
    return queryType.value === "timeline";
  },
  set(value) {
    queryType.value = value ? "timeline" : "search";
  },
});

const sortType = computedSearchParameter({
  searchParams,
  name: "sort",
  defaultValue: "default",
  sanitize: (value) =>
    narrowingIncludes(CHUB_SORT_TYPES, value) ? value : "default",
  onSet: () => {
    page.value = 1;
  },
});

const excludeMine = computedBooleanSearchParameter({
  searchParams,
  name: "exclude_mine",
  onSet: () => {
    page.value = 1;
  },
});
const includeForks = computedBooleanSearchParameter({
  searchParams,
  name: "include_forks",
  onSet: () => {
    page.value = 1;
  },
});
const nsfw = computedBooleanSearchParameter({
  searchParams,
  name: "nsfw",
  defaultValue: false,
  onSet: () => {
    page.value = 1;
  },
});
const nsfl = computedBooleanSearchParameter({
  searchParams,
  name: "nsfl",
  defaultValue: false,
  onSet: () => {
    page.value = 1;
  },
});

const topics = computedArraySearchParameter({
  searchParams,
  name: "topics",
  defaultValue: [],
  sanitize: (value) => value,
  onSet: () => {
    page.value = 1;
  },
});

const query = computed<ChubCardQuery>(() => {
  switch (queryType.value) {
    case "timeline":
      return { type: "timeline" };
    case "search":
    default:
      if (queryType.value !== "search") {
        console.warn(
          `Unexpected query type: ${queryType.value}. Defaulting to 'search'.`,
        );
      }
      return {
        type: "search",
        params: {
          ...(topics.value.length > 0 && { topics: topics.value.join(",") }),
          ...(search.value && { search: search.value }),
          ...(author.value && { username: author.value }),
          ...(!excludeMine.value && { exclude_mine: excludeMine.value }),
          ...(!includeForks.value && { include_forks: includeForks.value }),
          ...(nsfw.value && { nsfw: nsfw.value }),
          ...(nsfl.value && { nsfl: nsfl.value }),
          ...(sortType.value !== "default" && { sort: sortType.value }),
          ...(page.value !== 1 && { page: page.value }),
        },
      };
  }
});

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
  if (cardsQuery.data.value != null) {
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

const fullscreenCardQuery = useQuery({
  queryKey: ["chubGetCard", fullscreenCardId] as const,
  queryFn: ({ queryKey: [, id] }) =>
    id != null ? chubGetCard(id, { full: true }) : null,
});
const fullscreenCard = fullscreenCardQuery.data;

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
    <div v-if="!cards" class="chub-content loading">
      <span>Loading...</span>
    </div>
    <div class="chub-content" v-else>
      <div class="chub-controls">
        <label>
          Username (for chat placeholders)
          <input
            v-model="username"
            type="text"
            placeholder="Username"
            class="chub-username-input"
          />
        </label>
        <label>
          Avatar (for chat placeholders)
          <input
            v-model="avatarUrl"
            type="text"
            placeholder="Avatar URL"
            class="chub-avatar-input"
          />
        </label>
      </div>
      <div class="chub-page-controls buttons">
        <button @click="page = 1">«</button>
        <button @click="page -= 1">&lsaquo;</button>
        <label>
          Page
          <input type="number" v-model="page" />
        </label>
        <button @click="page += 1">&rsaquo;</button>
      </div>
      <div class="chub-controls">
        <input
          v-model="searchValue"
          @change="search = searchValue"
          type="text"
          placeholder="Search cards..."
          class="chub-search-input"
        />
        <label>
          Author
          <input
            v-model="authorValue"
            @change="author = authorValue"
            type="text"
            placeholder="Author username"
            class="chub-author-input"
          />
        </label>
        <label>
          Sort by
          <ChubSortDropdown v-model="sortType" />
        </label>
      </div>
      <div class="chub-checkboxes">
        <label>
          <input type="checkbox" v-model="isTimeline" />
          <span>Show timeline instead of search</span>
        </label>
        <label>
          <input type="checkbox" v-model="excludeMine" />
          <span>Exclude my cards</span>
        </label>
        <label>
          <input type="checkbox" v-model="includeForks" />
          <span>Include forks</span>
        </label>
        <label v-if="nsfw || nsfl">
          <input type="checkbox" v-model="nsfw" />
          <span>Show NSFW</span>
        </label>
        <label v-if="nsfl">
          <input type="checkbox" v-model="nsfl" />
          <span>Show NSFL</span>
        </label>
        <label v-if="nsfw || nsfl">
          <input type="checkbox" v-model="blurNsfw" />
          <span>Blur NSFW</span>
        </label>
        <label>
          <input type="checkbox" v-model="showCustomCss" />
          <span>Show custom CSS</span>
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
      <div v-if="cards.length === 0" class="chub-no-results">
        <span>No cards found! Try using different search filters.</span>
      </div>
      <div v-else class="chub-cards">
        <ChubCardPreview
          v-for="card in cards"
          :key="card.id"
          :card="card"
          :focused="card.id === fullscreenCardId"
          @openInFullscreen="fullscreenCardId = card.fullPath"
          @addTopic="addTopic"
          @searchByAuthor="author = $event"
        />
      </div>
    </div>
    <div class="chub-page-controls buttons">
      <button @click="page = 1">«</button>
      <button @click="page -= 1">&lsaquo;</button>
      <label>
        Page
        <input type="number" v-model="page" />
      </label>
      <button @click="page += 1">&rsaquo;</button>
    </div>
  </div>
  <Teleport v-if="fullscreenCard" to="body">
    <div class="fullscreen">
      <ChubCard
        :card="fullscreenCard"
        @close="fullscreenCardId = undefined"
        @openInFullscreen="fullscreenCardId = $event"
        @searchByAuthor="(fullscreenCardId = undefined), (author = $event)"
      />
    </div>
  </Teleport>
</template>

<style scoped>
.Chub {
  display: flex;
  flex-flow: column nowrap;
  width: 100%;
  height: 100%;
}

.chub-content {
  flex: 1 0 auto;
  display: flex;
  flex-direction: column;
  gap: 0.5em;
  overflow: auto;
}

.loading {
  font-size: 1.5em;
}

.chub-no-results {
  display: grid;
  place-items: center;
  font-size: 1.25em;
  text-align: center;
  flex: 1 0 auto;
}

.chub-controls {
  display: flex;
  gap: 0.5em;
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
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
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
