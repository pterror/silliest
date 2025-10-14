<script setup lang="ts">
import { decode } from "fast-png";
import exifr from "exifr";
import { computedAsync } from "@vueuse/core";
import { fileType } from "../../lib/filetype";
import SdWebuiInfoTab from "./SdWebuiInfoTab.vue";
import { onMounted, onUnmounted, ref } from "vue";
import type { ComfyuiPromptNodeData, ComfyuiWorkflow } from "./comfyuiTypes";
import ComfyuiInfoTab from "./ComfyuiInfoTab.vue";

const props = defineProps<{
  file: File;
  defaultChecked: boolean;
}>();
const emit = defineEmits<{
  close: [];
}>();

const imageUrl = ref<string | undefined>(undefined);

onMounted(() => {
  imageUrl.value = URL.createObjectURL(props.file);
});

onUnmounted(() => {
  if (!imageUrl.value) return;
  URL.revokeObjectURL(imageUrl.value);
});

const metadata = computedAsync(() =>
  props.file
    .arrayBuffer()
    .then(async (buffer) => {
      const [, mimetype] = fileType(new Uint8Array(buffer)) ?? [];
      switch (mimetype) {
        case "image/png": {
          const png = decode(buffer);
          if (png.text.parameters) {
            return { type: "sd-webui" as const, value: png.text.parameters };
          }
          if (png.text.prompt || png.text.workflow) {
            const promptJson = png.text.prompt ?? "{}";
            const workflowJson = png.text.workflow ?? "{}";
            const prompt = JSON.parse(
              promptJson.replace(/\bNaN\b/g, "null"),
            ) as Record<string, ComfyuiPromptNodeData>;
            const workflow = JSON.parse(
              workflowJson.replace(/\bNaN\b/g, "null"),
            ) as ComfyuiWorkflow;
            const nodes = Object.fromEntries(
              workflow.nodes.map((node) => [node.id, node]),
            );
            const links = Object.fromEntries(
              workflow.links.map((link) => [link[0], link]),
            );
            return {
              type: "comfyui" as const,
              value: {
                prompt,
                workflow,
                nodes,
                links,
                promptJson,
                workflowJson,
              },
            };
          }
          console.error(
            `PNG file '${props.file.name}' does not contain recognized metadata. Metadata:`,
            png.text,
          );
          break;
        }
        case "image/jpeg": {
          const exif = await exifr.parse(buffer, ["UserComment"]);
          const userCommentRaw = exif.userComment;
          return userCommentRaw
            ? {
                type: "sd-webui" as const,
                value: new TextDecoder().decode(
                  userCommentRaw.slice("UNICODE  ".length),
                ),
              }
            : undefined;
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
    }),
);
</script>

<template>
  <SdWebuiInfoTab
    v-if="metadata?.type == 'sd-webui'"
    :file-name="file.name"
    :metadata="metadata.value"
    :default-checked="defaultChecked"
    :image-url="imageUrl"
    @close="emit('close')"
  />
  <ComfyuiInfoTab
    v-else-if="metadata?.type == 'comfyui'"
    :file-name="file.name"
    :metadata="metadata.value"
    :default-checked="defaultChecked"
    :image-url="imageUrl"
    @close="emit('close')"
  />
</template>
