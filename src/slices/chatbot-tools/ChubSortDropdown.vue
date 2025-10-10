<script setup lang="ts">
import {
  CHUB_SORT_NAME_TO_TYPE,
  CHUB_SORT_NAMES,
  type ChubSortType,
} from "./chub";

const value = defineModel<ChubSortType>();
</script>

<template>
  <select v-model="value">
    <option
      v-for="sortName in CHUB_SORT_NAMES.slice(1)"
      :key="sortName"
      :value="CHUB_SORT_NAME_TO_TYPE[sortName]"
    >
      {{ sortName }}
    </option>
  </select>
</template>
