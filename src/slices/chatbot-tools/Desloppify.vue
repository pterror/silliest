<script setup lang="ts">
import { ref } from "vue";
import DesloppifyTab from "./DesloppifyTab.vue";

const files = ref<File[]>([]);

const onFileInput = (event: Event) => {
  if (!(event.currentTarget instanceof HTMLInputElement)) return;
  files.value = Array.from(event.currentTarget.files ?? []);
};
</script>

<template>
  <div class="Desloppify">
    <input type="file" multiple @input="onFileInput" />
    <div class="tab-container">
      <template class="tab-container" v-for="file in files">
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
  width: 100%;
  height: 100%;
}

.tab-container {
  display: flex;
  flex-flow: row wrap;
}
</style>
