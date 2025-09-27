<script setup lang="ts">
import { computed, inject, ref, toRaw, watchEffect } from "vue";
import {
  CHUB_TAGS_TO_HIDE,
  chubListForks,
  type ChubCard,
  type ChubCardFullPath,
  type ChubCardId,
} from "./chub";
import { useQuery } from "@tanstack/vue-query";
import { chubQueryOptions } from "./chubQuery";
import { useEventListener } from "@vueuse/core";
import { chubMarkdownToHtml } from "./chubMarkdown";
import { chubProviderKey } from "./chubProvider";
import { downloadExternalLinkWithoutContentDisposition } from "../../lib/download";
import {
  characterCardReplaceMacros,
  constructMacrosObject,
  parseExampleMessages,
} from "./characterCard";
import ChubCardPreview from "./ChubCardPreview.vue";

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
const imageUrl = computed(() =>
  props.card
    ? `https://avatars.charhub.io/avatars/${props.card.fullPath}/chara_card_v2.png`
    : null,
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

const forks = ref<readonly ChubCard[] | null>();

const loadForks = async () => {
  if (forks.value) return;
  forks.value = await chubListForks(props.card.id);
};
</script>

<template>
  <div v-if="!card || !imageUrl" class="ChubCard">
    <span>Loading...</span>
  </div>
  <div v-else class="ChubCard">
    <div class="chub-card-image">
      <img
        :src="imageUrl"
        class="transition-bg darken-on-hover"
        :class="{ blurred }"
        alt="Card Image"
        @click="fullscreenPreviewImage = imageUrl"
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
          @click="
            downloadExternalLinkWithoutContentDisposition(
              imageUrl,
              `main_${card.fullPath.replace(/.+[/]/, '')}_spec_v2.png`,
            )
          "
        >
          Download
        </button>
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
      <button @click="emit('searchByAuthor', author)">by {{ author }}</button>
      <label>
        <input type="checkbox" v-model="chatPreview" />
        Preview chat names
      </label>
      <img
        :src="imageUrl"
        class="chub-card-image-inline transition-bg darken-on-hover"
        :class="{ blurred }"
        alt="Card Image"
        @click="fullscreenPreviewImage = imageUrl"
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
            checked
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
                checked
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
          </div>
        </div>
        <label v-if="exampleDialogs.length" class="tab-title">
          <input
            type="radio"
            name="chub-card-tab"
            class="invisible-radio"
            value="example-messages"
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
                  <span>User</span>
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
        <label v-if="card.forksCount > 0" class="tab-title">
          <input
            type="radio"
            name="chub-card-tab"
            class="invisible-radio"
            value="forks"
            @click="loadForks()"
          />
          Forks ({{ card.forksCount }})
        </label>
        <div
          v-if="card.forksCount > 0 && forks?.length === 0"
          class="chub-card-no-forks tab-contents"
        >
          No public forks.
        </div>
        <div
          v-if="card.forksCount > 0 && forks?.length !== 0"
          class="chub-card-forks tab-contents"
        >
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

.chub-card-info {
  width: 100%;
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

.chub-card-no-forks {
  display: grid;
  place-items: center;
  font-size: 1.25em;
  text-align: center;
}

.chub-card-forks.chub-card-forks {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1em;
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
