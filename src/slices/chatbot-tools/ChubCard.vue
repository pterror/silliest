<script setup lang="ts">
import { computed, inject, ref, watchEffect } from "vue";
import {
  CHUB_TAGS_TO_HIDE,
  chubGetRatings,
  chubGetTavernCardAtCommit,
  chubListCommits,
  chubListForks,
  type ChubCard,
  type ChubCardFullPath,
  type ChubCardId,
  type ChubCommit,
  type ChubRatingsResponse,
} from "./chub";
import { useQuery } from "@tanstack/vue-query";
import { chubQueryOptions } from "./chubQuery";
import { useBrowserLocation, useEventListener, useTimeAgo } from "@vueuse/core";
import { chubMarkdownToHtml } from "./chubMarkdown";
import { chubProviderKey } from "./chubProvider";
import { downloadFile } from "../../lib/download";
import { constructMacrosObject, parseExampleMessages } from "./characterCard";
import ChubCardPreview from "./ChubCardPreview.vue";
import { chubCardToTavernCardFile } from "./chubPngHelpers";
import { jsonParse } from "../../lib/json";
import { getChubFilters } from "./chubFilters";
import { formatDateTime } from "../../lib/dateTime";
import ChubCardComment from "./ChubCardComment.vue";

const props = defineProps<{
  card: ChubCard<true>;
}>();
const emit = defineEmits<{
  close: [];
  openInFullscreen: [id: ChubCardId | ChubCardFullPath];
  searchByAuthor: [author: string];
  addTopic: [topic: string];
}>();

const configQuery = useQuery(chubQueryOptions("chubFetchEntireConfig", []));
const config = configQuery.data;
const { username, avatarUrl, blurNsfw, showCustomCss } =
  inject(chubProviderKey)!;
const fullscreenPreviewImage = ref<string | null>(null);
const chatPreview = ref(true);

const tokenCounts = computed(() => {
  const tokenCountsRaw = props.card.labels?.find(
    (l) => l.title === "TOKEN_COUNTS",
  )?.description;
  if (!tokenCountsRaw) return null;
  const tokenCounts = jsonParse(tokenCountsRaw);
  return tokenCounts;
});

const { isNsfw, isShadowNsfw, isNsfl, isShadowNsfl } = getChubFilters(
  props.card,
);

const author = computed(() => props.card.fullPath.replace(/[/][\s\S]+/, ""));

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

useEventListener("chub-image-click" as never, (event) => {
  const customEvent = event as CustomEvent<string>;
  fullscreenPreviewImage.value = customEvent.detail;
});

const macros = computed(() =>
  chatPreview.value
    ? constructMacrosObject({
        char: props.card.definition.name,
        user: username.value,
      })
    : undefined,
);

const exampleDialogs = computed(() =>
  parseExampleMessages(props.card.definition.example_dialogs),
);

const comments = ref<ChubRatingsResponse>();

const loadComments = async () => {
  if (comments.value) return;
  comments.value = await chubGetRatings(props.card.id);
};

const forks = ref<readonly ChubCard[] | null>();

const loadForks = async () => {
  if (forks.value) return;
  forks.value = await chubListForks(props.card.id);
};

const versions = ref<readonly ChubCommit[] | null>();

const loadVersions = async () => {
  if (versions.value) return;
  versions.value = await chubListCommits(props.card.id);
};

const newFile = (
  fileBits: BlobPart[],
  fileName: string,
  options?: FilePropertyBag,
) => new File(fileBits, fileName, options);

const location = useBrowserLocation();

const hash = computed({
  get() {
    return location.value.hash?.replace(/^#/, "") ?? "";
  },
  set(value) {
    location.value.hash = value;
  },
});

watchEffect(() => {
  if (hash.value === "chub-card-comments") {
    loadComments();
  } else if (hash.value === "chub-card-forks") {
    loadForks();
  } else if (hash.value === "chub-card-versions") {
    loadVersions();
  }
});
</script>

<template>
  <div class="ChubCard">
    <div class="chub-card-image">
      <img
        :src="card.max_res_url"
        class="transition-bg darken-on-hover"
        :class="{ blurred }"
        alt="Card Image"
        @click="fullscreenPreviewImage = card.max_res_url"
      />
    </div>
    <div class="chub-card-content">
      <div class="top-right-buttons buttons">
        <a
          :href="`https://chub.ai/characters/${card.fullPath}`"
          class="open-in-chub-button button"
          target="_blank"
        >
          Open in Chub
        </a>
        <button
          class="chub-card-download-button"
          @click="chubCardToTavernCardFile(card).then(downloadFile)"
        >
          Download
        </button>
        <button class="close-button" @click="emit('close')">&times;</button>
      </div>
      <h1>{{ card.name }}</h1>
      <div class="chub-card-topics">
        <button
          v-if="isNsfw"
          class="chub-card-topic"
          @click="emit('addTopic', 'NSFW')"
          :title="isShadowNsfw ? 'Shadow NSFW' : 'NSFW'"
        >
          {{ isShadowNsfw ? "(🔥)" : "🔥" }}
        </button>
        <button
          v-if="isNsfl"
          class="chub-card-topic"
          @click="emit('addTopic', 'NSFL')"
          :title="isShadowNsfl ? 'Shadow NSFL' : 'NSFL'"
        >
          {{ isShadowNsfl ? "(💀)" : "💀" }}
        </button>
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
      <button @click="emit('searchByAuthor', author)">by {{ author }}</button>
      <div class="chub-card-metadata">
        <span>
          created {{ formatDateTime(card.createdAt) }} ({{
            useTimeAgo(card.createdAt)
          }})
        </span>
        <span>
          updated {{ formatDateTime(card.lastActivityAt) }} ({{
            useTimeAgo(card.lastActivityAt)
          }})
        </span>
      </div>
      <div class="chub-card-stats">
        <div>Messages: {{ card.nMessages }}</div>
        <div>Chats: {{ card.nChats }}</div>
        <div>Favorites: {{ card.n_favorites }}</div>
        <div>Public Chats: {{ card.n_public_chats }}</div>
        <div>Downloads: {{ card.starCount }}</div>
      </div>
      <div v-if="tokenCounts" class="chub-card-token-counts">
        <span class="chub-card-token-count-heading">Tokens:</span>
        <div class="chub-card-token-counts-summary">
          <div>
            Permanent:
            {{
              tokenCounts.personality +
              tokenCounts.description +
              tokenCounts.scenario +
              tokenCounts.system_prompt +
              tokenCounts.post_history_instructions
            }}
          </div>
          <div>
            Temporary: {{ tokenCounts.first_mes + tokenCounts.mes_example }}
          </div>
        </div>
        <div class="chub-card-token-counts-details">
          <div v-if="tokenCounts.personality">
            Description:
            {{ tokenCounts.personality }}
          </div>
          <div v-if="tokenCounts.description">
            Personality:
            {{ tokenCounts.description }}
          </div>
          <div v-if="tokenCounts.scenario">
            Scenario:
            {{ tokenCounts.scenario }}
          </div>
          <div v-if="tokenCounts.system_prompt">
            System Prompt:
            {{ tokenCounts.system_prompt }}
          </div>
          <div v-if="tokenCounts.post_history_instructions">
            Post History Instructions:
            {{ tokenCounts.post_history_instructions }}
          </div>
          <div v-if="tokenCounts.first_mes">
            First Message:
            {{ tokenCounts.first_mes }}
          </div>
          <div v-if="tokenCounts.mes_example">
            Example Messages:
            {{ tokenCounts.mes_example }}
          </div>
        </div>
      </div>
      <label>
        <input type="checkbox" v-model="chatPreview" />
        Preview chat names
      </label>
      <img
        :src="card.max_res_url"
        class="chub-card-image-inline transition-bg darken-on-hover"
        :class="{ blurred }"
        alt="Card Image"
        @click="fullscreenPreviewImage = card.max_res_url"
      />
      <p
        class="chub-card-tagline"
        v-html="
          chubMarkdownToHtml(card.tagline, {
            unsafe: shouldShowCustomCss,
            macros,
          })
        "
      ></p>
      <div class="chub-card-info tab-container">
        <label class="tab-title">
          <input
            type="radio"
            name="chub-card-tab"
            class="invisible-radio"
            value="description"
            :checked="
              !hash ||
              hash === 'chub-card-description' ||
              !hash.startsWith('chub-card-')
            "
            @click="hash = 'chub-card-description'"
          />
          Description
        </label>
        <div
          class="chub-card-description tab-contents"
          v-html="
            chubMarkdownToHtml(card.description, {
              unsafe: shouldShowCustomCss,
              macros,
              disableAutoplay: false,
            })
          "
        ></div>
        <label class="tab-title">
          <input
            type="radio"
            name="chub-card-tab"
            class="invisible-radio"
            value="personality"
            :checked="hash === 'chub-card-personality'"
            @click="hash = 'chub-card-personality'"
          />
          Personality
        </label>
        <div
          class="chub-card-personality tab-contents"
          v-html="
            chubMarkdownToHtml(card.definition.personality, {
              unsafe: shouldShowCustomCss,
              macros,
            })
          "
        ></div>
        <label v-if="card.definition.scenario" class="tab-title">
          <input
            type="radio"
            name="chub-card-tab"
            class="invisible-radio"
            value="scenario"
            :checked="hash === 'chub-card-scenario'"
            @click="hash = 'chub-card-scenario'"
          />
          Scenario
        </label>
        <div
          v-if="card.definition.scenario"
          class="chub-card-scenario tab-contents"
          v-html="
            chubMarkdownToHtml(card.definition.scenario, {
              unsafe: shouldShowCustomCss,
              macros,
            })
          "
        ></div>
        <label class="tab-title">
          <input
            type="radio"
            name="chub-card-tab"
            class="invisible-radio"
            value="greetings"
            :checked="
              hash === 'chub-card-greetings' ||
              hash.startsWith('chub-card-greeting-')
            "
            @click="hash = 'chub-card-greetings'"
          />
          Greetings
        </label>
        <div class="chub-card-greetings tab-contents">
          <div class="tab-container">
            <label class="tab-title">
              <input
                type="radio"
                name="chub-card-greeting"
                class="invisible-radio"
                value="1"
                :checked="
                  !hash.startsWith('chub-card-greeting-') ||
                  hash === 'chub-card-greeting-1'
                "
                @click="hash = 'chub-card-greeting-1'"
              />
              1
            </label>
            <div
              class="tab-contents"
              v-html="
                chubMarkdownToHtml(card.definition.first_message, {
                  unsafe: shouldShowCustomCss,
                  macros,
                })
              "
            ></div>
            <template
              v-for="(msg, index) in card.definition.alternate_greetings"
            >
              <label class="tab-title">
                <input
                  type="radio"
                  name="chub-card-greeting"
                  class="invisible-radio"
                  :value="index + 2"
                  :checked="hash === `chub-card-greeting-${index + 2}`"
                  @click="hash = `chub-card-greeting-${index + 2}`"
                />
                {{ index + 2 }}
              </label>
              <div
                class="tab-contents"
                v-html="
                  chubMarkdownToHtml(msg, {
                    unsafe: shouldShowCustomCss,
                    macros,
                  })
                "
              ></div>
            </template>
            <div class="tab-title chub-card-tab-bar-spacer"></div>
          </div>
        </div>
        <label v-if="exampleDialogs.length" class="tab-title">
          <input
            type="radio"
            name="chub-card-tab"
            class="invisible-radio"
            value="example-messages"
            :checked="hash === 'chub-card-example-messages'"
            @click="hash = 'chub-card-example-messages'"
          />
          Example Messages
        </label>
        <div
          v-if="exampleDialogs.length"
          class="chub-card-conversations tab-contents"
        >
          <template v-for="(conversation, i) in exampleDialogs" :key="i">
            <hr v-if="i > 0" />
            <div class="chub-card-conversation">
              <div
                v-for="(message, j) in conversation"
                :key="j"
                class="chub-card-message"
                :class="[`chub-card-role-${message.role}`]"
              >
                <div
                  v-if="message.role === 'char'"
                  class="chub-card-message-author"
                >
                  <img
                    :src="card.avatar_url"
                    alt="Character Image"
                    class="chub-card-message-avatar"
                  />
                  <span>{{ card.definition.name }}</span>
                  <span v-if="message.error" class="chub-card-message-error">
                    {{ '(Error: Message does not start with "\{\{char\}\}:")' }}
                  </span>
                </div>
                <div v-else class="chub-card-message-author">
                  <img
                    :src="avatarUrl"
                    alt="Character Image"
                    class="chub-card-message-avatar"
                  />
                  <span>{{ username }}</span>
                </div>
                <div
                  class="chub-card-message-content"
                  v-html="
                    chubMarkdownToHtml(message.content, {
                      unsafe: shouldShowCustomCss,
                      macros,
                    })
                  "
                ></div>
              </div>
            </div>
          </template>
        </div>
        <label v-if="card.definition.system_prompt" class="tab-title">
          <input
            type="radio"
            name="chub-card-tab"
            class="invisible-radio"
            value="system-prompt"
            :checked="hash === 'chub-card-system-prompt'"
            @click="hash = 'chub-card-system-prompt'"
          />
          System Prompt
        </label>
        <div
          v-if="card.definition.system_prompt"
          class="chub-card-system-prompt tab-contents"
          v-html="
            chubMarkdownToHtml(card.definition.system_prompt, {
              unsafe: shouldShowCustomCss,
              macros,
            })
          "
        ></div>
        <label
          v-if="card.definition.post_history_instructions"
          class="tab-title"
        >
          <input
            type="radio"
            name="chub-card-tab"
            class="invisible-radio"
            value="post-history-instructions"
            :checked="hash === 'chub-card-post-history-instructions'"
            @click="hash = 'chub-card-post-history-instructions'"
          />
          Post History Instructions
        </label>
        <div
          v-if="card.definition.post_history_instructions"
          class="chub-card-system-prompt tab-contents"
          v-html="
            chubMarkdownToHtml(card.definition.post_history_instructions, {
              unsafe: shouldShowCustomCss,
              macros,
            })
          "
        ></div>
        <label class="tab-title">
          <input
            type="radio"
            name="chub-card-tab"
            class="invisible-radio"
            value="forks"
            :checked="hash === 'chub-card-comments'"
            @click="hash = 'chub-card-comments'"
          />
          Comments
        </label>
        <div class="tab-contents">
          <div
            v-if="!comments"
            class="chub-card-loading-comments chub-card-loading"
          >
            Loading...
          </div>
          <div
            class="chub-card-no-comments chub-card-no-results"
            v-else-if="comments?.ratings.length === 0"
          >
            No comments yet.
          </div>
          <div v-else class="chub-card-comments">
            <template v-for="commentId in comments.parents" :key="commentId">
              <ChubCardComment
                v-if="comments.ratings_map[commentId]"
                :comment="comments.ratings_map[commentId]"
                :ratings_map="comments.ratings_map"
              />
            </template>
          </div>
        </div>
        <label v-if="card.forksCount > 0" class="tab-title">
          <input
            type="radio"
            name="chub-card-tab"
            class="invisible-radio"
            value="forks"
            :checked="hash === 'chub-card-forks'"
            @click="hash = 'chub-card-forks'"
          />
          Forks ({{ card.forksCount }})
        </label>
        <div v-if="card.forksCount > 0" class="tab-contents">
          <div v-if="!forks" class="chub-card-forks-loading chub-card-loading">
            Loading...
          </div>
          <div
            v-else-if="forks.length === 0"
            class="chub-card-no-forks chub-card-no-results"
          >
            No public forks.
          </div>
          <div v-else class="chub-card-forks">
            <ChubCardPreview
              v-for="fork in forks"
              :key="fork.id"
              :card="fork"
              @close="emit('close')"
              @openInFullscreen="emit('openInFullscreen', fork.fullPath)"
              @searchByAuthor="
                emit('searchByAuthor', fork.fullPath.replace(/[/][\s\S]+/, ''))
              "
              @addTopic="(topic) => emit('addTopic', topic)"
            />
          </div>
        </div>
        <label class="tab-title">
          <input
            type="radio"
            name="chub-card-tab"
            class="invisible-radio"
            value="forks"
            :checked="hash === 'chub-card-versions'"
            @click="hash = 'chub-card-versions'"
          />
          Versions
        </label>
        <div class="tab-contents">
          <div
            v-if="!versions"
            class="chub-card-loading-versions chub-card-loading"
          >
            Loading...
          </div>
          <div v-else class="chub-card-versions">
            <div
              v-for="version in versions"
              :key="version.id"
              class="chub-card-version"
            >
              <div>{{ version.short_id }}</div>
              <div>{{ new Date(version.created_at).toLocaleString() }}</div>
              <button
                @click="
                  chubGetTavernCardAtCommit(card.id, version.id)
                    .then((tavernCard) =>
                      chubCardToTavernCardFile(card, tavernCard),
                    )
                    .then(downloadFile)
                "
              >
                PNG
              </button>
              <button
                @click="
                  chubGetTavernCardAtCommit(card.id, version.id).then(
                    (tavernCard) =>
                      downloadFile(
                        newFile(
                          [JSON.stringify(tavernCard)],
                          `main_${card.fullPath.replace(
                            /.+[/]/,
                            '',
                          )}_spec_v2.json`,
                          { type: 'application/json' },
                        ),
                      ),
                  )
                "
              >
                JSON
              </button>
            </div>
          </div>
        </div>
        <div class="tab-title chub-card-tab-bar-spacer"></div>
      </div>
    </div>
  </div>
  <div
    v-if="fullscreenPreviewImage"
    class="fullscreen-preview transition-bg"
    @click="fullscreenPreviewImage = null"
  >
    <img
      :src="fullscreenPreviewImage"
      @click.stop
      class="fullscreen-preview-image"
    />
  </div>
</template>

<style scoped>
.ChubCard {
  position: relative;
  height: 100%;
  display: flex;
  flex-flow: row nowrap;
  overflow: auto;
}

.ChubCard > * {
  flex: 1 0 0;
}

:deep(img:not(:is(.fullscreen-preview-image, .chub-card-message-avatar))) {
  cursor: pointer;
  border-radius: var(--radius-default);
}

:deep(
    img:not(:is(.fullscreen-preview-image, .chub-card-message-avatar))
  ):hover {
  filter: brightness(0.8);
  transition-property: filter;
  transition-duration: 150ms;
}

.chub-card-tab-bar-spacer {
  flex: 1 0 100%;
  padding: 0;
}

.chub-card-info :deep(hr) {
  width: calc(100% - 2em);
  margin: 0 1em;
}

.chub-card-content {
  display: flex;
  flex-flow: column nowrap;
  padding: 1em;
  gap: 1em;
  align-items: center;
  height: fit-content;
  /* max-width: 100ch; */
  padding-bottom: 1em;
}

.chub-card-content > * {
  overflow-wrap: break-word;
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
  cursor: pointer;
  position: sticky;
  top: 0;
  display: grid;
  align-self: center;
  place-items: center;
  height: 100%;
  max-width: 40%;
}

.chub-card-image > img {
  /* not an ideal solution as it assumes the image is the only thing on its side of the screen.
   * not sure why `max-height: 100%` does not work. */
  max-height: 100vh;
  object-fit: contain;
}

.chub-card-image-inline {
  cursor: pointer;
  display: none;
  align-self: center;
  max-height: 50vh;
}

@media screen and (max-width: 1000px) {
  .chub-card-image {
    display: none;
  }

  .chub-card-image-inline {
    display: block;
  }
}

.chub-card-tagline,
.chub-card-description,
.chub-card-greetings,
.chub-card-conversations,
.chub-card-personality,
.chub-card-scenario,
.chub-card-system-prompt,
.chub-card-post-history-instructions {
  max-width: 100ch;
  overflow-wrap: break-word;
}

:is(
    .chub-card-tagline,
    .chub-card-description,
    .chub-card-greetings,
    .chub-card-conversations,
    .chub-card-personality,
    .chub-card-scenario,
    .chub-card-system-prompt,
    .chub-card-post-history-instructions
  )
  :deep(p) {
  margin: 0;
}

:deep(code) {
  white-space: pre-wrap;
}

:deep(img) {
  max-width: 100%;
}

.chub-card-greetings > div > .tab-title {
  min-width: 1.5em;
  text-align: center;
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

.chub-card-conversations > hr {
  width: calc(100% - 2em);
  margin: 0.5em 1em;
}

.chub-card-conversation {
  display: flex;
  flex-flow: column nowrap;
  gap: 0.5em;
}

.chub-card-message-author {
  display: flex;
  align-items: center;
  gap: 0.75em;
}

.chub-card-message-avatar {
  width: 2em;
  height: 2em;
  border-radius: 50%;
  object-fit: contain;
}

.chub-card-role-char {
  background-color: var(--bg-secondary);
  border-radius: var(--radius-default);
  padding: 1em;
  margin-right: 2em;
}

.chub-card-role-user {
  background-color: var(--bg-tertiary);
  border-radius: var(--radius-default);
  padding: 1em;
  margin-left: 2em;
}

.chub-card-message-error {
  color: oklch(80% 30% 20);
}

.chub-card-loading,
.chub-card-no-results {
  place-items: center;
  font-size: 1.25em;
  text-align: center;
}

.chub-card-forks.chub-card-forks {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1em;
}

.chub-card-versions {
  display: grid;
  grid-template-columns: repeat(4, auto);
  gap: 0 1em;
}

.chub-card-version {
  display: contents;
}

.chub-card-token-counts {
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  font-size: 0.9em;
  opacity: 0.8;
}

.chub-card-token-counts-summary,
.chub-card-token-counts-details {
  display: flex;
  flex-flow: row wrap;
  gap: 1em;
  justify-content: center;
}

.chub-card-stats {
  font-size: 0.9em;
  opacity: 0.7;
  display: flex;
  flex-flow: row wrap;
  gap: 0.25em 1em;
  justify-content: center;
}

.chub-card-token-counts {
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  font-size: 0.9em;
  opacity: 0.8;
}

.chub-card-token-counts-details {
  display: flex;
  flex-flow: row wrap;
  gap: 1em;
  justify-content: center;
}

.chub-card-metadata {
  display: flex;
  flex-flow: column nowrap;
  gap: 0.25em;
  align-items: center;
  font-size: 0.9em;
  opacity: 0.7;
}

.chub-card-comments {
  display: flex;
  flex-flow: column-reverse nowrap;
  gap: 1em;
  padding: 0 1em;
}

:deep(.chub-card-macro) {
  color: oklch(80% 30% 180);
}

:deep(.chub-card-macro-char) {
  color: oklch(80% 30% 330);
}

:deep(.chub-card-macro-user) {
  color: oklch(80% 30% 240);
}

:deep(q) {
  color: oklch(80% 10% 240);
}
</style>
