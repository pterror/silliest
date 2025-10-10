<script setup lang="ts">
import { useTimeAgo } from "@vueuse/core";
import {
  isChubDeletedRating,
  type ChubRating,
  type ChubRatingId,
} from "./chub";

defineProps<{
  comment: ChubRating;
  ratings_map: Record<ChubRatingId, ChubRating>;
}>();
</script>

<template>
  <div class="ChubCardRating">
    <div class="chub-card-rating-comment-container">
      <label class="chub-card-rating-comment-children-toggle">
        <input class="invisible-checkbox" type="checkbox" checked />
        <div
          v-if="comment.children.length"
          class="chub-card-rating-comment-children-toggle-open"
        >
          +
        </div>
        <div
          v-if="comment.children.length"
          class="chub-card-rating-comment-children-toggle-close"
        >
          -
        </div>
        <div
          v-if="!comment.children.length"
          class="chub-card-rating-comment-children-toggle-disabled"
        ></div>
      </label>
      <div
        class="chub-card-rating-comment"
        :class="{
          'chub-card-rating-comment-deleted': isChubDeletedRating(comment),
        }"
      >
        <div class="chub-card-rating-comment-header">
          <a
            class="chub-card-rating-comment-user"
            :href="
              comment.username
                ? `https://chub.ai/users/${encodeURIComponent(
                    comment.username,
                  )}`
                : undefined
            "
            target="_blank"
          >
            <img
              class="chub-card-rating-comment-user-avatar"
              v-if="comment.avatarUrl"
              :src="comment.avatarUrl"
            />
            <div class="chub-card-rating-comment-user-avatar" v-else></div>
            <span>{{ comment.username }}</span>
          </a>
          <div class="chub-card-rating-comment-meta">
            <div
              v-if="
                comment.updatedAt && comment.updatedAt !== comment.createdAt
              "
              class="chub-card-rating-comment-date"
              :title="new Date(comment.updatedAt).toLocaleString()"
            >
              (updated {{ useTimeAgo(comment.updatedAt) }})
            </div>
            <div
              v-if="comment.createdAt"
              class="chub-card-rating-comment-date"
              :title="new Date(comment.createdAt).toLocaleString()"
            >
              {{ useTimeAgo(comment.createdAt) }}
            </div>
            <div
              class="chub-card-rating-comment-rating"
              :class="
                !comment.rating ? 'chub-card-rating-comment-rating-none' : ''
              "
            >
              <template v-for="i in 5" :key="i">
                <span
                  class="chub-card-rating-comment-rating-star chub-card-rating-comment-rating-star-filled"
                  v-if="i <= (comment.rating ?? 0)"
                  >★</span
                >
                <span
                  class="chub-card-rating-comment-rating-star chub-card-rating-comment-rating-star-empty"
                  v-else
                  >☆</span
                >
              </template>
            </div>
          </div>
        </div>
        <div class="chub-card-rating-comment-body">
          {{ comment.comment }}
        </div>
      </div>
    </div>
    <div
      class="chub-card-rating-comment-children"
      v-for="childId in comment.children"
      :key="childId"
    >
      <ChubCardComment
        v-if="ratings_map[childId]"
        :comment="ratings_map[childId]"
        :ratings_map="ratings_map"
      />
    </div>
  </div>
</template>

<style scoped>
.ChubCardRating {
  display: flex;
  gap: 0.5em;
  flex-flow: column nowrap;
  align-items: stretch;
}

.ChubCardRating:has(
    > .chub-card-rating-comment-container
      > .chub-card-rating-comment-children-toggle
      > input:not(:checked)
  )
  > .chub-card-rating-comment-children {
  display: none;
}

.chub-card-rating-comment-children-toggle-open,
.chub-card-rating-comment-children-toggle-close,
.chub-card-rating-comment-children-toggle-disabled {
  display: inline-grid;
  place-items: center;
  font-size: 2em;
  width: 1lh;
  height: 1lh;
  border-radius: var(--radius-small);
  transition-property: background-color 150ms;
}

:is(
    .chub-card-rating-comment-children-toggle-open,
    .chub-card-rating-comment-children-toggle-close
  ):hover {
  background: var(--bg-secondary);
}

input:not(:checked) ~ .chub-card-rating-comment-children-toggle-close {
  display: none;
}

input:checked ~ .chub-card-rating-comment-children-toggle-open {
  display: none;
}

.chub-card-rating-comment-container {
  display: flex;
  gap: 0.5em;
  flex-flow: row nowrap;
  align-items: center;
}

.chub-card-rating-comment {
  background: var(--bg-secondary);
  padding: 1em;
  border-radius: var(--radius-default);
  flex: 1 0 0;
}

.chub-card-rating-comment-deleted {
  font-style: italic;
  opacity: 70%;
}

.chub-card-rating-comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5em;
}

.chub-card-rating-comment-rating-none {
  opacity: 0;
}

.chub-card-rating-comment-meta {
  display: flex;
  gap: 1em;
  align-items: center;
  font-size: 0.9em;
  opacity: 70%;
}

.chub-card-rating-comment-user {
  display: flex;
  align-items: center;
  gap: 0.5em;
  font-weight: bold;
  color: unset;
  text-decoration: none;
  margin: -0.25em;
  padding: 0.25em;
  border-radius: var(--radius-small);
  transition: background-color 150ms;
}

.chub-card-rating-comment-user:hover {
  background: var(--bg-secondary);
}

.chub-card-rating-comment-user::after {
  display: none;
}

.chub-card-rating-comment-user-avatar {
  width: 1.5em;
  height: 1.5em;
  border-radius: 50%;
}

.chub-card-rating-comment-children {
  display: flex;
  gap: 0.5em;
  flex-flow: column nowrap;
  margin-left: 2em;
}
</style>
