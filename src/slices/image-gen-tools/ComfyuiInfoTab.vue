<script setup lang="ts">
import { computed, ref, Teleport } from "vue";
import {
  extractIpAdapterName,
  extractModelName,
  extractPromptContent,
  type ComfyuiPromptNodeData,
  type ComfyuiWorkflow,
  type ComfyuiWorkflowLink,
  type ComfyuiWorkflowNodeData,
} from "./comfyuiTypes";
import ComfyuiPromptNode from "./ComfyuiPromptNode.vue";
import ComfyuiWorkflowNode from "./ComfyuiWorkflowNode.vue";
import { hashString } from "../../lib/hash";

const props = defineProps<{
  fileName: string;
  metadata: {
    prompt: Record<string, ComfyuiPromptNodeData>;
    workflow: ComfyuiWorkflow;
    nodes: Record<string, ComfyuiWorkflowNodeData>;
    links: Record<string, ComfyuiWorkflowLink>;
    promptJson: string;
    workflowJson: string;
    value?: never;
  };
  imageUrl: string | undefined;
  defaultChecked: boolean;
}>();
const emit = defineEmits<{
  close: [];
}>();

const model = computed(() =>
  extractModelName(
    props.metadata.nodes,
    props.metadata.links,
    props.metadata.prompt,
  ),
);

const ipadapter = computed(() =>
  extractIpAdapterName(
    props.metadata.nodes,
    props.metadata.links,
    props.metadata.prompt,
  ),
);

const positivePrompt = computed(() =>
  extractPromptContent(props.metadata.nodes, props.metadata.links, "positive"),
);

const negativePrompt = computed(() =>
  extractPromptContent(props.metadata.nodes, props.metadata.links, "negative"),
);

const fullscreenPreviewVisible = ref(false);

const copy = (text: string) => {
  navigator.clipboard.writeText(text);
};

const typeColors = computed(() => {
  const allTypes = new Set([
    "text",
    "number",
    "lora",
    ...(props.metadata.workflow.nodes.flatMap((n) => [
      ...n.inputs.map((i) => i.type),
      ...n.outputs.map((o) => o.type),
    ]) ?? []),
  ]);
  let styles = "";
  for (const type of allTypes) {
    const typeName = String(type).toLowerCase();
    const hue = hashString(typeName) % 360;
    styles += `
.comfyui-workflow-node-type-${typeName} {
  color: oklch(70% 30% ${hue}deg);
}
`;
  }
  return styles;
});
</script>

<template>
  <label class="SdWebuiInfoTabTitle tab-title">
    <input
      type="radio"
      name="desloppify-tab"
      class="invisible-radio"
      :checked="defaultChecked"
    />
    {{ fileName }}
    <button class="transition-bg" @click="emit('close')">&times;</button>
  </label>
  <div v-if="metadata" class="SdWebuiInfoTabContents tab-contents">
    <img
      v-if="imageUrl"
      class="image transition-bg darken-on-hover"
      :src="imageUrl"
      @click="fullscreenPreviewVisible = true"
    />
    <h3>Metadata</h3>
    <div class="tab-container">
      <label class="tab-title">
        <input
          type="radio"
          class="invisible-radio"
          :name="`metadata-tab-${imageUrl}`"
          value="prompts"
          checked
        />
        Info
      </label>
      <div class="comfyui-info-prompts tab-contents">
        <h3>Model</h3>
        <div v-if="model" class="buttons">
          <button @click="copy(model)">Copy</button>
        </div>
        <span v-if="model">{{ model }}</span>
        <span v-else>No model found.</span>
        <template v-if="ipadapter">
          <h3>IP-Adapter</h3>
          <div class="buttons">
            <button @click="copy(ipadapter)">Copy</button>
          </div>
          <span>{{ ipadapter }}</span>
        </template>
        <h3>Positive Prompt</h3>
        <div v-if="positivePrompt" class="buttons">
          <button @click="copy(positivePrompt)">Copy</button>
        </div>
        <span v-if="positivePrompt">{{ positivePrompt }}</span>
        <span v-else>No positive prompt found.</span>
        <h3>Negative Prompt</h3>
        <div v-if="negativePrompt" class="buttons">
          <button @click="copy(negativePrompt)">Copy</button>
        </div>
        <span v-if="negativePrompt">{{ negativePrompt }}</span>
        <span v-else>No negative prompt found.</span>
      </div>
      <label class="tab-title">
        <input
          type="radio"
          class="invisible-radio"
          :name="`metadata-tab-${imageUrl}`"
          value="prompt"
        />
        Prompt (nodes)
      </label>
      <div class="comfyui-info-prompt-nodes tab-contents">
        <ComfyuiPromptNode
          v-for="(node, id) in metadata.prompt"
          :id="id"
          :node="node"
          :all-nodes="metadata.prompt"
        />
      </div>
      <label class="tab-title">
        <input
          type="radio"
          class="invisible-radio"
          :name="`metadata-tab-${imageUrl}`"
          value="workflow"
        />
        Workflow (nodes)
      </label>
      <div class="comfyui-info-workflow-nodes tab-contents">
        <ComfyuiWorkflowNode
          v-for="node in metadata.workflow.nodes"
          :key="node.id"
          :node="node"
          :prompt="metadata.prompt"
          :workflow="metadata.workflow"
          :nodes="metadata.nodes"
          :links="metadata.links"
        />
      </div>
      <label class="tab-title">
        <input
          type="radio"
          class="invisible-radio"
          :name="`metadata-tab-${imageUrl}`"
          value="prompt-raw"
        />
        Prompt (raw)
      </label>
      <div class="comfyui-info-prompt-raw tab-contents">
        <div class="buttons">
          <button @click="copy(metadata.promptJson)">Copy</button>
        </div>
        <pre>{{ metadata.promptJson }}</pre>
      </div>
      <label class="tab-title">
        <input
          type="radio"
          class="invisible-radio"
          :name="`metadata-tab-${imageUrl}`"
          value="workflow-raw"
        />
        Workflow (raw)
      </label>
      <div class="comfyui-info-workflow-raw tab-contents">
        <div class="buttons">
          <button @click="copy(metadata.workflowJson)">Copy</button>
        </div>
        <pre>{{ metadata.workflowJson }}</pre>
      </div>
    </div>
  </div>
  <component is="style" v-html="typeColors"></component>
  <Teleport v-if="fullscreenPreviewVisible && imageUrl" to="body">
    <div
      class="fullscreen-preview transition-bg"
      @click="fullscreenPreviewVisible = false"
    >
      <img :src="imageUrl" @click.stop />
    </div>
  </Teleport>
</template>

<style scoped>
.metadata {
  white-space: pre-wrap;
  word-break: break-word;
}

.image {
  height: 256px;
  margin: 0 auto;
  cursor: pointer;
  border-radius: 0.25em;
}

.fullscreen-preview:hover:not(:has(> *:hover)) {
  cursor: pointer;
  background: var(--bg-darken-darker);
}

pre {
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
