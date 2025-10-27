<script setup lang="ts">
import { computedAsync } from "@vueuse/core";
import { computed } from "vue";
import type { SillyTavernChatlog } from "./sillytavern";
import { markdownToHtml } from "../../lib/markdown";
import { chubMarkdownToHtml } from "./chubMarkdown";

const props = defineProps<{
  readonly file: File;
  readonly defaultChecked: boolean;
}>();
const emit = defineEmits<{
  close: [];
}>();

const metadata = computedAsync<SillyTavernChatlog | undefined>(() =>
  props.file
    .text()
    .then((text) => text.split("\n").map((line) => JSON.parse(line)))
    .catch(() => undefined),
);

const title = computed(
  () =>
    metadata.value?.find((entry) => !entry.is_user && !entry.is_system)?.name ??
    props.file.name.replace(/[.]jsonl$/, ""),
);
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
  <div v-if="!metadata" class="ChatTabContents tab-contents">
    Could not read metadata from this file.
  </div>
  <div v-else class="ChatTabContents tab-contents">
    <div class="chat-tab-messages">
      <template v-for="(entry, i) in metadata" :key="i">
        <div v-if="entry.mes" class="chat-tab-message">
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
            <div class="chat-tab-message-send-date">
              {{ entry.send_date }}
            </div>
          </div>
          <div
            class="chat-tab-message-contents"
            v-html="chubMarkdownToHtml(entry.mes, { unsafe: true })"
          ></div>
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

.chat-tab-message-send-date {
  margin-left: auto;
  font-size: 0.75em;
  opacity: 0.6;
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
</style>
