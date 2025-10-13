<script setup lang="ts">
import type { ComfyuiPromptNodeData } from "./comfyuiTypes";

defineProps<{
  id: string;
  node: ComfyuiPromptNodeData;
  allNodes: Record<string, ComfyuiPromptNodeData>;
}>();
</script>

<template>
  <div class="ComfyuiPromptNode">
    <h3 :id="`comfyui-prompt-node-${id}`">{{ node._meta.title }}</h3>
    <div class="metadata"><strong>Type:</strong> {{ node.class_type }}</div>
    <div class="metadata">
      <strong>Inputs:</strong>
      <table class="comfyui-prompt-node-inputs-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(value, key) in node.inputs" :key="key">
            <td>
              <strong>{{ key }}</strong>
            </td>
            <td
              v-if="
                Array.isArray(value) &&
                value.length === 2 &&
                typeof value[0] === 'string' &&
                typeof value[1] === 'number'
              "
            >
              <a :href="`#comfyui-prompt-node-${value[0]}`">{{
                allNodes[value[0]]!._meta.title
              }}</a>
              (input {{ value[1] }})
            </td>
            <td v-else-if="typeof value === 'object'">
              <code>{{ value }}</code>
            </td>
            <td v-else>{{ value }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.comfyui-prompt-node-inputs-table :is(th, td) {
  padding: 0 0.2em;
}

.comfyui-prompt-node-inputs-table :is(th, td):first-child {
  text-align: right;
}

.comfyui-prompt-node-inputs-table :is(th, td):last-child {
  text-align: left;
}

td {
  word-break: break-word;
}
</style>
