<script setup lang="ts">
import { computed, provide, ref, Teleport, toRaw, watchEffect } from "vue";
import {
  chubGetCard,
  CHUB_SORT_TYPES,
  CHUB_CARD_QUERY_TYPES,
  CHUB_SORT_NAMES,
  CHUB_SORT_NAME_TO_TYPE,
  chubGetCardsByQuery,
  type ChubCard as ChubCardType,
  type ChubCardFullPath,
  type ChubCardId,
  type ChubCardQuery,
  type ChubEncodedCursor,
} from "./chub";
import { useLocalStorage } from "@vueuse/core";
import ChubCardPreview from "./ChubCardPreview.vue";
import { narrowingIncludes, unwrapPossibleSingleton } from "../../lib/array";
import { useQuery } from "@tanstack/vue-query";
import { chubQueryOptions } from "./chubQuery";
import ChubCard from "./ChubCard.vue";
import { chubProviderKey } from "./chubProvider";
import {
  computedSearchParameter,
  useComputedSearchParams,
} from "../../lib/composables/vueUse";

// TODO: local-only list of topics to hide (e.g. spammy topics like SillyTavern and TAVERN and V2 Alternate greetings)

const username = useLocalStorage("chub-placeholder-username", "User");
const avatarUrl = useLocalStorage(
  "chub-placeholder-avatar",
  "https://sillie.st/3c.png",
);
const blurNsfw = useLocalStorage("chub-blur-nsfw", true);
const showCustomCss = useLocalStorage("chub-show-custom-css", true);
const showWorkshopLink = useLocalStorage("chub-show-workshop-link", false, {
  writeDefaults: false,
});

provide(chubProviderKey, {
  username,
  avatarUrl,
  blurNsfw,
  showCustomCss,
  showWorkshopLink,
});

const showMoreControls = ref(false);

const {
  searchParams,
  params: {
    page,
    cursor,
    search,
    author,
    name_like: nameLike,
    query_type: queryType,
    sort,
    asc,
    max_days_ago: maxDaysAgo,
    min_tokens: minTokens,
    max_tokens: maxTokens,
    exclude_mine: excludeMine,
    include_forks: includeForks,
    require_custom_prompt: requireCustomPrompt,
    require_example_dialogues: requireExampleDialogues,
    require_images: requireImages,
    require_expressions: requireExpressions,
    require_lore: requireLore,
    require_lore_embedded: requireLoreEmbedded,
    require_lore_linked: requireLoreLinked,
    require_alternate_greetings: requireAlternateGreetings,
    nsfw_only: nsfwOnly,
    nsfw,
    nsfl,
    "topic[]": topics,
    "exclude_topic[]": excludedTopics,
  },
} = useComputedSearchParams(
  {
    page: { type: "number", defaultValue: 1 },
    cursor: { type: "string", hideWhenDefault: false },
    search: { type: "string" },
    author: { type: "string" },
    name_like: { type: "string" },
    query_type: {
      type: "string",
      defaultValue: "search",
      sanitize: (value) =>
        narrowingIncludes(CHUB_CARD_QUERY_TYPES, value) ? value : "search",
    },
    sort: {
      type: "string",
      defaultValue: "created_at",
      sanitize: (value) =>
        narrowingIncludes(CHUB_SORT_TYPES, value) ? value : "created_at",
    },
    asc: { type: "boolean" },
    max_days_ago: { type: "number" },
    min_tokens: { type: "number", defaultValue: 200 },
    max_tokens: { type: "number", defaultValue: 100_000 },
    exclude_mine: { type: "boolean", defaultValue: true },
    include_forks: { type: "boolean", defaultValue: true },
    require_custom_prompt: { type: "boolean" },
    require_example_dialogues: { type: "boolean" },
    require_images: { type: "boolean" },
    require_expressions: { type: "boolean" },
    require_lore: { type: "boolean" },
    require_lore_embedded: { type: "boolean" },
    require_lore_linked: { type: "boolean" },
    require_alternate_greetings: { type: "boolean" },
    nsfw_only: { type: "boolean" },
    nsfw: { type: "boolean", hideWhenDefault: false },
    nsfl: { type: "boolean", hideWhenDefault: false },
    "topic[]": { type: "string[]" },
    "exclude_topic[]": { type: "string[]" },
  },
  undefined,
  { writeMode: "push" },
  {
    onSet: (param) => {
      if (param !== "page" && param !== "cursor") {
        if ("cursor" in searchParams) {
          cursor.value = "";
        } else {
          page.value = 1;
        }
      }
    },
  },
);

watchEffect(() => {
  if (!("workshop" in searchParams)) return;
  showWorkshopLink.value = searchParams.workshop === "true";
  delete searchParams.workshop;
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

const isTimeline = computed({
  get() {
    return queryType.value === "timeline";
  },
  set(value) {
    queryType.value = value ? "timeline" : "search";
  },
});

const allowedParams = [
  "page",
  "cursor",
  "search",
  "username",
  "topics",
  "first",
  "namespace",
  "chub",
  "venus",
  "only_mine",
  "my_favorites",
  "min_tokens",
  "max_tokens",
  "min_tags",
  "min_ai_rating",
  "language",
  "asc",
  "recommended_verified",
  "require_custom_prompt",
  "require_example_dialogues",
  "require_images",
  "require_expressions",
  "require_lore",
  "require_lore_embedded",
  "require_lore_linked",
  "require_alternate_greetings",
  "inclusive_or",
  "excludetopics",
  "include_forks",
  "exclude_mine",
  "name_like",
  "nsfw",
  "nsfl",
  "nsfw_only",
  "max_days_ago",
  "min_users_chatted",
  "max_messages",
  "special_mode",
];
const params = computed(() => {
  const params: Record<string, unknown> = {};
  for (const key of Object.keys(searchParams)) {
    if (!allowedParams.includes(key)) continue;
    params[key] = searchParams[key];
  }
  return params;
});

const query = computed<ChubCardQuery>(() => {
  switch (queryType.value) {
    case "timeline":
      return {
        type: "timeline",
        params: { page: page.value, cursor: cursor.value },
      };
    case "search":
    default: {
      if (queryType.value !== "search") {
        console.warn(
          `Unexpected query type: ${queryType.value}. Defaulting to 'search'.`,
        );
      }
      const { cursor, ...rest } = params.value;
      return {
        type: "search",
        params: {
          sort: sort.value ?? "created_at",
          ...(topics.value.length > 0 && { topics: topics.value.join(",") }),
          ...(excludedTopics.value.length > 0 && {
            excludetopics: excludedTopics.value.join(","),
          }),
          ...(author.value && { username: author.value }),
          ...(includeForks.value && { include_forks: true }),
          ...(cursor ? { cursor: cursor as ChubEncodedCursor } : undefined),
          ...rest,
        },
      };
    }
  }
});

watchEffect(async () => {
  if ("cursor" in searchParams && page.value && page.value > 1) {
    const clonedQuery = structuredClone(toRaw(query.value));
    if (!clonedQuery.params?.page) return;
    clonedQuery.params = {
      ...clonedQuery.params,
      page: clonedQuery.params.page - 1,
    };
    const results = await chubGetCardsByQuery(clonedQuery);
    page.value = 1; // Clear page parameter if using cursor pagination
    cursor.value = results.cursor ?? "";
  }
});

const fullscreenCardQuery = useQuery({
  queryKey: ["chubGetCard", fullscreenCardId] as const,
  queryFn: ({ queryKey: [, id] }) =>
    id != null ? chubGetCard(id, { full: true }) : null,
});
const fullscreenCard = ref(fullscreenCardQuery.data.value);

watchEffect(() => {
  if (
    fullscreenCardId.value != null &&
    fullscreenCardQuery.data.value == null
  ) {
    // The data is just loading.
    return;
  }
  fullscreenCard.value = fullscreenCardQuery.data.value;
});

const title = computed(() => {
  if (fullscreenCard.value?.name) {
    return `${fullscreenCard.value.name} | chub`;
  }
  if (query.value.type === "search") {
    const authorString = author.value ? ` by ${author.value}` : "";
    const topicsString = topics.value.length
      ? ` on ${topics.value.join(", ")}`
      : "";
    const searchString = search.value ? `"${search.value}" ` : "";
    return `${searchString}cards${authorString}${topicsString} | chub`;
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
    cards.value = cardsQuery.data.value.nodes;
  }
});

// For shadow nsfw detection
const withoutNsfwQuery = computed((): ChubCardQuery => {
  if (!nsfw.value && !nsfl.value) return query.value;
  if (query.value.type !== "search") return query.value;
  const firstCard = cardsQuery.data.value?.nodes[0];
  if (!firstCard) return query.value;
  const { page, ...params } = query.value.params;
  const needsCursor = page && page > 1;
  if (needsCursor && !("cursor" in params)) return query.value;
  return {
    type: "search",
    params: { ...params, nsfw: false, nsfl: true },
  };
});

// For shadow nsfl detection
const withoutNsflQuery = computed((): ChubCardQuery => {
  if (!nsfl.value) return query.value;
  if (query.value.type !== "search") return query.value;
  const firstCard = cardsQuery.data.value?.nodes[0];
  if (!firstCard) return query.value;
  const { page, ...params } = query.value.params;
  const needsCursor = page && page > 1;
  if (needsCursor && !("cursor" in params)) return query.value;
  return {
    type: "search",
    params: { ...params, nsfw: true, nsfl: false },
  };
});

const cardsQueryWithoutNsfw = useQuery(
  chubQueryOptions("chubGetCardsByQuery", [withoutNsfwQuery], {
    enabled: computed(
      () => toRaw(withoutNsfwQuery.value) !== toRaw(query.value),
    ),
  }),
);

const cardsQueryWithoutNsfl = useQuery(
  chubQueryOptions("chubGetCardsByQuery", [withoutNsflQuery], {
    enabled: computed(
      () =>
        withoutNsflQuery.value != null &&
        toRaw(withoutNsflQuery.value) !== toRaw(query.value),
    ),
  }),
);

const newTopic = ref("");

const addNewTopic = () => {
  const topic = newTopic.value.trim();
  if (topic === "") return;
  addTopic(newTopic.value);
  newTopic.value = "";
};

const addTopic = (topic: string) => {
  if (topics.value.includes(topic)) return;
  topics.value.push(topic);
  topics.value = [...topics.value];
};

const removeTopic = (topic: string) => {
  if (!topics.value.includes(topic)) return;
  const index = topics.value.indexOf(topic);
  if (index === -1) return;
  topics.value.splice(index, 1);
  topics.value = [...topics.value];
};

const newExcludedTopic = ref("");

const addNewExcludedTopic = () => {
  const topic = newExcludedTopic.value.trim();
  if (topic === "") return;
  addExcludedTopic(newExcludedTopic.value);
  newExcludedTopic.value = "";
};

const addExcludedTopic = (topic: string) => {
  if (excludedTopics.value.includes(topic)) return;
  excludedTopics.value.push(topic);
  excludedTopics.value = [...excludedTopics.value];
};

const removeExcludedTopic = (topic: string) => {
  if (!excludedTopics.value.includes(topic)) return;
  const index = excludedTopics.value.indexOf(topic);
  if (index === -1) return;
  excludedTopics.value.splice(index, 1);
  excludedTopics.value = [...excludedTopics.value];
};
</script>

<template>
  <div class="Chub">
    <div v-if="!cards" class="chub-content loading">
      <span>Loading...</span>
    </div>
    <div class="chub-content" v-else>
      <label class="chub-search">
        Search
        <input
          type="text"
          placeholder="Search cards..."
          class="chub-search-input"
          :value="search"
          @change="
            // @ts-expect-error event targets are not well typed in vue
            search = $event.target.value.trim()
          "
        />
      </label>
      <div class="chub-page-controls buttons">
        <template v-if="'cursor' in searchParams">
          <button @click="cursor = ''">«</button>
          <span>
            Page
            <input
              type="number"
              @change="
                // @ts-expect-error event targets are not well typed in vue
                page = $event.target.valueAsNumber
              "
            />
          </span>
          <button @click="cursor = cardsQuery.data.value.cursor ?? ''">
            &rsaquo;
          </button>
          <button @click="delete searchParams.cursor">
            To normal pagination
          </button>
        </template>
        <template v-else>
          <button @click="page = 1">«</button>
          <button @click="page -= 1">&lsaquo;</button>
          <label>
            Page
            <input
              type="number"
              :value="page"
              @change="
                // @ts-expect-error event targets are not well typed in vue
                page = $event.target.valueAsNumber
              "
            />
          </label>
          <button @click="page += 1">&rsaquo;</button>
          <button @click="cursor = ''">To cursor pagination</button>
        </template>
      </div>
      <div class="chub-more-controls-container">
        <button
          class="chub-show-more-controls"
          @click="showMoreControls = !showMoreControls"
        >
          ⚙ Show more controls
        </button>
        <div class="chub-more-controls" :class="{ visible: showMoreControls }">
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
          <div class="chub-controls">
            <label>
              Author
              <input
                type="text"
                placeholder="Author username"
                class="chub-author-input"
                :value="author"
                @change="
                  // @ts-expect-error event targets are not well typed in vue
                  author = $event.target.value.trim()
                "
              />
            </label>
            <label>
              Name
              <input
                type="text"
                placeholder="Character name"
                class="chub-name-input"
                :value="nameLike"
                @change="
                  // @ts-expect-error event targets are not well typed in vue
                  nameLike = $event.target.value.trim()
                "
              />
            </label>
            <label>
              Max days ago
              <input
                v-model="maxDaysAgo"
                type="number"
                min="0"
                placeholder="Maximum days ago"
                class="chub-max-days-ago-input"
              />
            </label>
            <label>
              Min tokens
              <input
                v-model="minTokens"
                type="number"
                min="0"
                placeholder="Minimum tokens"
                class="chub-min-tokens-input"
              />
            </label>
            <label>
              Max tokens
              <input
                v-model="maxTokens"
                type="number"
                min="0"
                placeholder="Maximum tokens"
                class="chub-max-tokens-input"
              />
            </label>
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
            <label v-if="'nsfw' in searchParams || 'nsfl' in searchParams">
              <input type="checkbox" v-model="nsfw" />
              <span>Show NSFW</span>
            </label>
            <label v-if="'nsfl' in searchParams">
              <input type="checkbox" v-model="nsfl" />
              <span>Show NSFL</span>
            </label>
            <label v-if="'nsfw' in searchParams || 'nsfl' in searchParams">
              <input type="checkbox" v-model="nsfwOnly" />
              <span>NSFW only</span>
            </label>
            <label v-if="'nsfw' in searchParams || 'nsfl' in searchParams">
              <input type="checkbox" v-model="blurNsfw" />
              <span>Blur NSFW</span>
            </label>
            <label>
              <input type="checkbox" v-model="showCustomCss" />
              <span>Show custom CSS</span>
            </label>
          </div>
          <div class="chub-require-checkboxes">
            <label>
              <input type="checkbox" v-model="requireCustomPrompt" />
              Require custom prompt
            </label>
            <label>
              <input type="checkbox" v-model="requireExampleDialogues" />
              Require example dialogues
            </label>
            <label>
              <input type="checkbox" v-model="requireImages" />
              Require images
            </label>
            <label>
              <input type="checkbox" v-model="requireExpressions" />
              Require expressions
            </label>
            <label>
              <input type="checkbox" v-model="requireLore" />
              Require lore
            </label>
            <label>
              <input type="checkbox" v-model="requireLoreEmbedded" />
              Require embedded lorebook
            </label>
            <label>
              <input type="checkbox" v-model="requireLoreLinked" />
              Require linked lorebook(s)
            </label>
            <label>
              <input type="checkbox" v-model="requireAlternateGreetings" />
              Require alternate greetings
            </label>
          </div>
        </div>
      </div>
      <div class="chub-sort-by">
        <label>
          <input type="checkbox" v-model="asc" />
          Sort ascending
        </label>
        <label>
          <input
            class="invisible-radio"
            type="radio"
            name="chub-sort-type"
            value="timeline"
            :checked="isTimeline"
            @change="isTimeline = true"
          />
          Timeline
        </label>
        <label v-for="sortName in CHUB_SORT_NAMES.slice(1)" :key="sortName">
          <input
            class="invisible-radio"
            type="radio"
            name="chub-sort-type"
            :value="CHUB_SORT_NAME_TO_TYPE[sortName]"
            :checked="sort === CHUB_SORT_NAME_TO_TYPE[sortName]"
            @change="
              (isTimeline = false), (sort = CHUB_SORT_NAME_TO_TYPE[sortName])
            "
          />
          {{ sortName }}
        </label>
      </div>
      <div class="chub-topics">
        <label>Tags</label>
        <div v-for="topic in topics" class="chub-topic">
          <span>
            {{ topic }}
          </span>
          <button @click="removeTopic(topic)">&times;</button>
        </div>
        <div class="chub-add-topic">
          <input
            v-model="newTopic"
            @keyup.enter="addNewTopic"
            placeholder="Add topic"
            :size="1"
            class="chub-topic-input"
          />
          <button @click="addNewTopic">+</button>
        </div>
      </div>
      <div class="chub-excluded-topics">
        <label>Tags to exclude</label>
        <div v-for="topic in excludedTopics" class="chub-topic">
          <span>
            {{ topic }}
          </span>
          <button @click="removeExcludedTopic(topic)">&times;</button>
        </div>
        <div class="chub-add-excluded-topic">
          <input
            v-model="newExcludedTopic"
            @keyup.enter="addNewExcludedTopic"
            placeholder="Add topic"
            :size="1"
            class="chub-topic-input"
          />
          <button @click="addNewExcludedTopic">+</button>
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
          :isHiddenInNsfw="
            cardsQueryWithoutNsfw.data.value?.nodes.every(
              (c) => c.id !== card.id,
            ) ?? false
          "
          :isHiddenInNsfl="
            cardsQueryWithoutNsfl.data.value?.nodes.every(
              (c) => c.id !== card.id,
            ) ?? false
          "
          @openInFullscreen="fullscreenCardId = $event"
          @addTopic="addTopic"
          @searchByAuthor="author = $event"
        />
      </div>
    </div>
    <div class="chub-page-controls buttons">
      <template v-if="'cursor' in searchParams">
        <button @click="cursor = ''">«</button>
        <span>
          Page
          <input
            type="number"
            @change="
              // @ts-expect-error event targets are not well typed in vue
              page = $event.target.valueAsNumber
            "
          />
        </span>
        <button @click="cursor = cardsQuery.data.value.cursor ?? ''">
          &rsaquo;
        </button>
        <button @click="delete searchParams.cursor">
          To normal pagination
        </button>
      </template>
      <template v-else>
        <button @click="page = 1">«</button>
        <button @click="page -= 1">&lsaquo;</button>
        <label>
          Page
          <input
            type="number"
            :value="page"
            @change="
              // @ts-expect-error event targets are not well typed in vue
              page = $event.target.valueAsNumber
            "
          />
        </label>
        <button @click="page += 1">&rsaquo;</button>
        <button @click="cursor = ''">To cursor pagination</button>
      </template>
    </div>
  </div>
  <Teleport v-if="fullscreenCard" to="body">
    <div class="fullscreen">
      <ChubCard
        :card="fullscreenCard"
        @close="fullscreenCardId = undefined"
        @openInFullscreen="fullscreenCardId = $event"
        @searchByAuthor="(fullscreenCardId = undefined), (author = $event)"
        @addTopic="addTopic($event), (fullscreenCardId = undefined)"
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

body:has(.fullscreen) .Chub {
  opacity: 0;
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
  flex-flow: row wrap;
}

:is(.chub-topics, .chub-excluded-topics) > label {
  font-weight: bold;
}

:is(.chub-topics, .chub-excluded-topics) {
  display: flex;
  flex-flow: row wrap;
  align-items: center;
  gap: 0.5em;
}

:is(.chub-add-topic, .chub-add-excluded-topic) {
  display: flex;
  align-items: center;
  gap: 0.25em;
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

.chub-checkboxes,
.chub-require-checkboxes {
  display: flex;
  flex-flow: row wrap;
  gap: 0.5em;

  > label {
    display: flex;
    align-items: center;
    gap: 0.25em;
  }
}

.chub-sort-by {
  display: flex;
  flex-flow: row wrap;
  gap: 0.25em;
}

.chub-sort-by label {
  cursor: pointer;
  padding: 0.25em;
  border-radius: 4px;
}

.chub-sort-by label:has(> :checked) {
  font-weight: bold;
  background: var(--bg-tertiary);
}

.chub-search {
  width: 100%;
  display: flex;
  gap: 0.5em;

  > .chub-search-input {
    flex: 1 0 auto;
  }
}

.chub-show-more-controls {
  align-self: flex-start;
}

.chub-more-controls-container {
  position: relative;
}

.chub-more-controls {
  position: absolute;
  display: none;
  flex-flow: column;
  padding: 1em;
  background: var(--bg-secondary-opaque);
  border-radius: 0.5em;
  margin-top: 0.5em;
}

.chub-more-controls.visible {
  display: flex;
}
</style>
