<script setup lang="ts">
import type {
  ComfyuiPromptNodeData,
  ComfyuiWorkflow,
  ComfyuiWorkflowLink,
  ComfyuiWorkflowNode,
} from "./comfyuiTypes";

defineProps<{
  node: ComfyuiWorkflowNode;
  prompt: Record<string, ComfyuiPromptNodeData>;
  workflow: ComfyuiWorkflow;
  nodes: Record<string, ComfyuiWorkflowNode>;
  links: Record<string, ComfyuiWorkflowLink>;
}>();
</script>

<template>
  <div class="ComfyuiWorkflowNode">
    <h3 :id="`comfyui-workflow-node-${node.id}`">
      {{ prompt[node.id]?._meta.title ?? node.type }}
    </h3>
    <h4>{{ node.type }}</h4>
    <div class="comfyui-workflow-node-values">
      <div class="comfyui-workflow-node-inputs">
        <h4>Inputs</h4>
        <div v-for="input in node.inputs" :key="input.name">
          <span
            :class="`comfyui-workflow-node-type-${String(
              input.type,
            ).toLowerCase()}`"
            :title="`Type: ${String(input.type)}`"
          >
            {{ input.name }}
          </span>
          <a
            v-if="input.link"
            :href="`#comfyui-workflow-node-${nodes[links[input.link]![1]]?.id!}`"
          >
            {{
              prompt[nodes[links[input.link]![1]]?.id ?? 0]?._meta.title ??
              nodes[links[input.link]![1]]?.type
            }}
            >
            {{
              nodes[links[input.link]![1]]?.outputs[links[input.link]![2]]?.name
            }}
          </a>
        </div>
      </div>
      <div class="comfyui-workflow-node-outputs">
        <h4>Outputs</h4>
        <template v-for="output in node.outputs" :key="output.name">
          <div>
            <span
              :class="`comfyui-workflow-node-type-${String(
                output.type,
              ).toLowerCase()}`"
              :title="`Type: ${String(output.type)}`"
            >
              {{ output.name }}
            </span>
            <a
              v-for="link in output.links"
              :key="link"
              :href="`#comfyui-workflow-node-${nodes[links[link]![3]]?.id!}`"
            >
              {{
                prompt[nodes[links[link]![3]]?.id ?? 0]?._meta.title ??
                nodes[links[link]![3]]?.type
              }}
              >
              {{ nodes[links[link]![3]]?.inputs[links[link]![4]]?.name }}
            </a>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ComfyuiWorkflowNode {
  align-self: flex-start;
  padding: 0.5em 1em;
  border-radius: var(--radius-default);
  background-color: var(--bg-secondary);
}

.comfyui-workflow-node-values {
  display: flex;
  gap: 1em;
  margin-top: 0.5em;
  flex-flow: row wrap;
}

.comfyui-workflow-node-inputs a,
.comfyui-workflow-node-outputs a {
  display: block;
  padding-left: 1em;
}
</style>
