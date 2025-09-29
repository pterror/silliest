<script setup lang="ts">
import { ref } from "vue";
import SdWebuiInfoTab from "./SdWebuiInfoTab.vue";

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
  <div class="SdWebuiInfo">
    <input type="file" multiple @input="onFileInput" />
    <div class="tab-container">
      <template v-for="file in files" :key="file.name">
        <SdWebuiInfoTab
          :file="file"
          :default-checked="file === files[0]"
          @close="files.splice(files.indexOf(file), 1)"
        />
      </template>
    </div>
  </div>
</template>

<style scoped>
.SdWebuiInfo {
  display: flex;
  flex-flow: column;
  gap: 1em;
  flex: 1 0 0;
}
</style>
