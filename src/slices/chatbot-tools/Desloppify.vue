<script setup lang="ts">
import { ref } from "vue";
import DesloppifyTab from "./DesloppifyTab.vue";

const files = ref<readonly File[]>([]);

const onFileInput = (event: Event) => {
  if (!(event.currentTarget instanceof HTMLInputElement)) return;
  files.value = Array.from(event.currentTarget.files ?? []);
};
</script>

<template>
  <div class="Desloppify">
    <input id="file-input" type="file" @input="onFileInput" />
    <div v-for="file in files">
      <DesloppifyTab :file="file" />
    </div>
  </div>
</template>

<style scoped>
.Desloppify {
  display: flex;
  flex-flow: column;
  gap: 1em;
}
</style>
