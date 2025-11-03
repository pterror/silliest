<script setup lang="ts">
import { computed, ref } from "vue";
import { downloadBlob } from "../../lib/download";
import { toCharacterBook, type AnyLorebook } from "./sillytavern";
import { unsafeMutable } from "../../lib/object";

defineProps<{ name: string; defaultChecked: boolean }>();
const emit = defineEmits<{
  close: [];
}>();

const lorebook = defineModel<AnyLorebook>();
const newKey = ref("");
const newSecondaryKey = ref("");

const entries = computed(() => {
  if (!lorebook.value) return [];
  const entries = lorebook.value.entries;
  return Array.isArray(entries) ? entries : Object.values(entries);
});

const exportAsCcv2 = () => {
  if (!lorebook.value) return;
  const ccv2 = toCharacterBook(lorebook.value);
  downloadBlob(
    new Blob([JSON.stringify(ccv2)], { type: "application/json" }),
    "lorebook_ccv2.json",
  );
};

const exportAsSillyTavern = () => {
  if (!lorebook.value) return;
  downloadBlob(
    new Blob([JSON.stringify(lorebook.value)], { type: "application/json" }),
    "lorebook_sillytavern.json",
  );
};
</script>

<template>
  <label class="LorebookEditorTabTitle tab-title">
    <input
      type="radio"
      name="desloppify-tab"
      class="invisible-radio"
      :checked="defaultChecked"
    />
    {{ name }}
    <button class="transition-bg" @click="emit('close')">&times;</button>
  </label>
  <div class="LorebookEditorTabContents tab-contents">
    <div class="lorebook-editor-tab-buttons">
      <button @click="exportAsCcv2">Export (Character Card v2)</button>
      <button @click="exportAsSillyTavern">Export (SillyTavern)</button>
    </div>
    <div>
      <div
        v-for="entry in entries"
        :key="'uid' in entry ? entry.uid : entry.id"
      >
        <label>
          <span>Name</span>
          <input v-if="'name' in entry" v-model="entry.name" />
          <input v-else v-model="entry.comment" />
        </label>
        <label>
          <span>ID</span>
          <input v-if="'uid' in entry" type="text" v-model="entry.uid" />
          <input v-else type="text" v-model="entry.id" />
        </label>
        <label>
          <span>Keys</span>
          <div>
            <input
              v-if="'keys' in entry"
              v-for="(key, i) in entry.keys"
              :key="`${i}-a`"
              v-model="entry.keys[i]"
            />
            <input
              v-else-if="'key' in entry"
              v-for="(key, i) in entry.key"
              :key="`${i}-b`"
              v-model="entry.key[i]"
            />
            <div>
              <input type="text" v-model="newKey" placeholder="Add new key" />
              <button
                @click="
                  unsafeMutable(
                    'keys' in entry
                      ? entry.keys
                      : (unsafeMutable(entry).key ??= []),
                  ).push(newKey)
                "
              >
                Add
              </button>
            </div>
          </div>
        </label>
        <label>
          <span>Secondary Keys</span>
          <div>
            <input
              v-if="'secondary_keys' in entry && entry.secondary_keys"
              v-for="(_key, i) in entry.secondary_keys"
              :key="`${i}-a`"
              v-model="entry.secondary_keys[i]"
            />
            <input
              v-else-if="'keysecondary' in entry"
              v-for="(_key, i) in entry.keysecondary"
              :key="`${i}-b`"
              v-model="entry.keysecondary[i]"
            />
            <div>
              <input
                type="text"
                v-model="newSecondaryKey"
                placeholder="Add new secondary key"
              />
              <button
                @click="
                  unsafeMutable(
                    'keys' in entry
                      ? (unsafeMutable(entry).secondary_keys ??= [])
                      : (unsafeMutable(entry).keysecondary ??= []),
                  ).push(newSecondaryKey)
                "
              >
                Add
              </button>
            </div>
          </div>
        </label>
      </div>
    </div>
  </div>
</template>

<style scoped>
.LorebookEditorTabContents {
  align-items: center;
}
</style>
