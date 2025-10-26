<script setup lang="ts">
import {
  inputNodeOutputFromLink,
  inputNodeNameFromLink,
  outputNodeInputFromLink,
  outputNodeNameFromLink,
  type ComfyuiPromptNodeData,
  type ComfyuiWorkflow,
  type ComfyuiWorkflowLink,
  type ComfyuiWorkflowNodeData,
  getWidgetType,
} from "./comfyui";

defineProps<{
  node: ComfyuiWorkflowNodeData;
  prompt: Record<string, ComfyuiPromptNodeData>;
  workflow: ComfyuiWorkflow;
  nodes: Record<string, ComfyuiWorkflowNodeData>;
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
      <div>
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
              class="comfyui-workflow-node-value"
              :href="`#comfyui-workflow-node-${nodes[links[input.link]![1]]?.id!}`"
            >
              {{ inputNodeNameFromLink(links[input.link]!, nodes, prompt) }}
              >
              {{ inputNodeOutputFromLink(links[input.link]!, nodes)?.name }}
            </a>
          </div>
        </div>
        <div class="comfyui-workflow-node-widgets">
          <h4>Widgets</h4>
          <template
            v-for="(widget, name) in prompt[node.id]?.inputs"
            :key="name"
          >
            <div v-if="node.inputs.every((i) => i.name !== name)">
              <span
                class="comfyui-workflow-node-widget-name"
                :class="`comfyui-workflow-node-type-${getWidgetType(
                  widget,
                ).toLowerCase()}`"
                :title="`Type: ${getWidgetType(widget)}`"
                >{{ name }}</span
              >
              <span class="comfyui-workflow-node-value">{{ widget }}</span>
            </div>
          </template>
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
              class="comfyui-workflow-node-value"
              :href="`#comfyui-workflow-node-${nodes[links[link]![3]]?.id!}`"
            >
              {{ outputNodeNameFromLink(links[link]!, nodes) }}
              >
              {{ outputNodeInputFromLink(links[link]!, nodes)?.name }}
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

.comfyui-workflow-node-value {
  display: block;
  padding-left: 1em;
}
</style>
