<script setup lang="ts">
import { decode } from "fast-png";
import { computedAsync } from "@vueuse/core";
import { computed, onMounted, onUnmounted, ref, Teleport } from "vue";
import { fileType } from "../../lib/filetype";
import type { ComfyuiPromptNodeData, ComfyuiWorkflow } from "./comfyuiTypes";
import ComfyuiPromptNode from "./ComfyuiPromptNode.vue";
import ComfyuiWorkflowNode from "./ComfyuiWorkflowNode.vue";
import { hashString } from "../../lib/hash";

const props = defineProps<{
  file: File;
  defaultChecked: boolean;
}>();
const emit = defineEmits<{
  close: [];
}>();

const title = props.file.name;

const fullscreenPreviewVisible = ref(false);

const imageUrl = ref<string | undefined>(undefined);

onMounted(() => {
  imageUrl.value = URL.createObjectURL(props.file);
});

onUnmounted(() => {
  if (!imageUrl.value) return;
  URL.revokeObjectURL(imageUrl.value);
});

function copy(text: string) {
  navigator.clipboard.writeText(text);
}

function copyPrompt() {
  if (!metadata.value) return;
  copy(metadata.value.promptJson);
}

function copyWorkflow() {
  if (!metadata.value) return;
  copy(metadata.value.workflowJson);
}

const metadata = computedAsync(() =>
  props.file
    .arrayBuffer()
    .then(async (buffer) => {
      const [, mimetype] = fileType(new Uint8Array(buffer)) ?? [];
      switch (mimetype) {
        case "image/png": {
          const png = decode(buffer);
          if (!png.text.prompt && !png.text.workflow) {
            return null;
          }
          const promptJson = png.text.prompt ?? "{}";
          const workflowJson = png.text.workflow ?? "{}";
          const prompt = JSON.parse(
            promptJson.replace(/\bNaN\b/g, "null"),
          ) as Record<string, ComfyuiPromptNodeData>;
          const workflow = JSON.parse(
            workflowJson.replace(/\bNaN\b/g, "null"),
          ) as ComfyuiWorkflow;
          const nodes = Object.fromEntries(
            workflow.nodes.map((node, index) => [node.id, node]),
          );
          const links = Object.fromEntries(
            workflow.links.map((link) => [link[0], link]),
          );
          const positivePrompt = String(
            Object.values(prompt).find((node) =>
              node._meta.title.includes("Positive Prompt"),
            )?.inputs.text,
          );
          const negativePrompt = String(
            Object.values(prompt).find((node) =>
              node._meta.title.includes("Negative Prompt"),
            )?.inputs.text,
          );
          return {
            positivePrompt,
            negativePrompt,
            prompt,
            workflow,
            nodes,
            links,
            promptJson,
            workflowJson,
          };
        }
        default: {
          throw new Error(`Unsupported file type: ${mimetype ?? "unknown"}`);
        }
      }
    })
    .catch((error) => {
      console.error(
        `Could not decode PNG file '${props.file.name}'`,
        "Error:",
        error,
      );
      throw new Error("Could not decode PNG file");
    }),
);

const typeColors = computed(() => {
  const allTypes = new Set(
    metadata.value?.workflow.nodes.flatMap((n) => [
      ...n.inputs.map((i) => i.type),
      ...n.outputs.map((o) => o.type),
    ]) ?? [],
  );
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
    {{ title }}
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
          name="metadata-tab"
          value="prompts"
          checked
        />
        Prompt (text)
      </label>
      <div class="comfyui-info-prompts tab-contents">
        <h3>Positive Prompt</h3>
        <div class="buttons">
          <button @click="copy(metadata.positivePrompt)">Copy</button>
        </div>
        {{ metadata.positivePrompt }}
        <h3>Negative Prompt</h3>
        <div class="buttons">
          <button @click="copy(metadata.negativePrompt)">Copy</button>
        </div>
        {{ metadata.negativePrompt }}
      </div>
      <label class="tab-title">
        <input
          type="radio"
          class="invisible-radio"
          name="metadata-tab"
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
          name="metadata-tab"
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
          name="metadata-tab"
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
          name="metadata-tab"
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
