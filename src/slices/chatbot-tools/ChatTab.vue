<script setup lang="ts">
import { computedAsync } from "@vueuse/core";
import { computed, ref, watch } from "vue";
import type {
  SillyTavernChatlog,
  SillyTavernChatlogEntry,
} from "./sillytavern";
import { chubMarkdownToHtml } from "./chubMarkdown";

const props = defineProps<{
  readonly file: File;
  readonly defaultChecked: boolean;
}>();
const emit = defineEmits<{
  close: [];
}>();

const swipeMessageIndex = ref<number>();
const swipeIndex = ref<number>();

const messages = computedAsync<SillyTavernChatlog | undefined>(() =>
  props.file
    .text()
    .then((text) => text.split("\n").map((line) => JSON.parse(line)))
    .catch(() => undefined),
);

const title = computed(
  () =>
    messages.value?.find((entry) => !entry.is_user && !entry.is_system)?.name ??
    props.file.name.replace(/[.]jsonl$/, ""),
);

const markdownCache = new Map<string, string>();

watch(
  () => props.file,
  () => {
    swipeIndex.value = undefined;
    swipeMessageIndex.value = undefined;
    markdownCache.clear();
  },
);

const cachedMarkdownToHtml = (markdown: string) => {
  const cached = markdownCache.get(markdown);
  if (cached) return cached;
  const html = chubMarkdownToHtml(markdown, { unsafe: true });
  markdownCache.set(markdown, html);
  return html;
};

const swipeLeft = (entry: SillyTavernChatlogEntry, i: number) => {
  const newSwipeIndex = Math.max(
    ((swipeMessageIndex.value === i ? swipeIndex.value : entry.swipe_id) ?? 0) -
      1,
    0,
  );
  if (newSwipeIndex === entry.swipe_id) {
    swipeIndex.value = undefined;
    swipeMessageIndex.value = undefined;
    return;
  }
  swipeIndex.value = newSwipeIndex;
  swipeMessageIndex.value = i;
};

const swipeRight = (entry: SillyTavernChatlogEntry, i: number) => {
  const newSwipeIndex = Math.min(
    ((swipeMessageIndex.value === i ? swipeIndex.value : entry.swipe_id) ?? 0) +
      1,
    (entry.swipes?.length ?? 1) - 1,
  );
  if (newSwipeIndex === entry.swipe_id) {
    swipeIndex.value = undefined;
    swipeMessageIndex.value = undefined;
    return;
  }
  swipeIndex.value = newSwipeIndex;
  swipeMessageIndex.value = i;
};
</script>

<template>
  <label class="ChatTabTitle tab-title">
    <input
      type="radio"
      name="desloppify-tab"
      class="invisible-radio"
      :checked="defaultChecked"
    />
    {{ title }}
    <button class="transition-bg" @click="emit('close')">&times;</button>
  </label>
  <div v-if="!messages" class="ChatTabContents tab-contents">
    Could not read metadata from this file.
  </div>
  <div v-else class="ChatTabContents tab-contents">
    <div class="chat-tab-messages">
      <template
        v-for="(entry, i) in messages.slice(
          0,
          (swipeMessageIndex ?? messages.length) + 1,
        )"
        :key="i"
      >
        <div v-if="entry.mes || entry.swipes" class="chat-tab-message">
          <div class="chat-tab-message-author">
            <div class="chat-tab-message-author-name">{{ entry.name }}</div>
            <div
              class="chat-tab-message-author-role"
              :class="`chat-tab-message-author-role-${
                entry.is_user
                  ? 'user'
                  : entry.is_system
                  ? 'system'
                  : 'character'
              }`"
            >
              {{
                entry.is_user
                  ? "User"
                  : entry.is_system
                  ? "System"
                  : "Character"
              }}
            </div>
            <div class="chat-tab-message-message-id">#{{ i }}</div>
            <div class="chat-tab-message-send-date">
              {{ entry.send_date }}
            </div>
          </div>
          <div
            class="chat-tab-message-contents"
            v-html="
              cachedMarkdownToHtml(
                i === swipeMessageIndex
                  ? entry.swipes?.[swipeIndex ?? 0] ?? entry.mes
                  : entry.mes,
              )
            "
          ></div>
          <div
            v-if="(entry.swipes?.length ?? 1) > 1"
            class="chat-tab-message-swipe-info"
          >
            <button
              class="chat-tab-message-swipe-left"
              @click="swipeLeft(entry, i)"
            >
              &lt;
            </button>
            <div class="chat-tab-message-swipe-counts">
              <span class="chat-tab-message-swipe-counts-current">{{
                ((i === swipeMessageIndex ? swipeIndex : entry.swipe_id) ?? 0) +
                1
              }}</span
              >/<span class="chat-tab-message-swipe-counts-total">{{
                entry.swipes?.length ?? 1
              }}</span>
            </div>
            <button
              class="chat-tab-message-swipe-right"
              @click="swipeRight(entry, i)"
            >
              &gt;
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.ChatTabContents {
  align-items: center;
}

.chat-tab-messages {
  display: flex;
  flex-flow: column nowrap;
  gap: 0.5em;
  max-width: 70ch;
}

.chat-tab-message {
  padding: 1em;
  border-radius: var(--radius-small);
  background-color: var(--bg-secondary);
}

.chat-tab-message-author {
  display: flex;
  align-items: center;
  gap: 0.5em;
}

.chat-tab-message-author-role {
  font-size: 0.8em;
  font-weight: normal;
  opacity: 0.8;
  background-color: var(--bg-secondary);
  border-radius: var(--radius-small);
  padding: 0.1em 0.4em;
}

.chat-tab-message-message-id {
  font-size: 0.75em;
  opacity: 0.6;
}

.chat-tab-message-send-date {
  margin-left: auto;
  font-size: 0.75em;
  opacity: 0.6;
}

.chat-tab-message-swipe-info {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5em;
  font-size: 0.8em;
  opacity: 0.7;
}

.chat-tab-message-author-role-user {
  color: oklch(90% 40% 240);
}

.chat-tab-message-author-role-system {
  color: oklch(90% 40% 180);
}

.chat-tab-message-author-role-character {
  color: oklch(90% 40% 330);
}

.chat-tab-message-contents :deep(img) {
  max-width: 100%;
}
</style>
