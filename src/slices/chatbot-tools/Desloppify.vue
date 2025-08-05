<script setup lang="ts">
import { ref } from "vue";
import DesloppifyTab from "./DesloppifyTab.vue";

const files = ref<File[]>([]);

const onFileInput = (event: Event) => {
  if (!(event.currentTarget instanceof HTMLInputElement)) return;
  files.value = [
    ...files.value,
    ...Array.from(event.currentTarget.files ?? []),
  ];
};
</script>

<template>
  <div class="Desloppify">
    <input type="file" multiple @input="onFileInput" />
    <div class="tab-container">
      <template v-for="file in files" :key="file.name" class="tab-container">
        <DesloppifyTab
          :file="file"
          :default-checked="file === files[0]"
          @close="files.splice(files.indexOf(file), 1)"
        />
      </template>
    </div>
  </div>
</template>

<style scoped>
.Desloppify {
  display: flex;
  flex-flow: column;
  gap: 1em;
  flex: 1 0 0;
}

.tab-container {
  display: flex;
  flex-flow: row wrap;
}
</style>
