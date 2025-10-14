import type { UUID } from "../../lib/types";

export type ComfyuiType = string & {
  __brand: "ComfyuiType";
};

export type ComfyuiWorkflowId = UUID & {
  __brand: "ComfyuiWorkflowId";
};

export type ComfyuiWorkflowNodeId = number & {
  __brand: "ComfyuiWorkflowNodeId";
};

export type ComfyuiWorkflowLinkId = number & {
  __brand: "ComfyuiWorkflowLinkId";
};

export interface ComfyuiPromptNodeData {
  readonly class_type: string;
  readonly inputs: Record<string, unknown>;
  readonly _meta: {
    readonly title: string;
  };
}

export interface ComfyuiWorkflowNodeInput {
  readonly name: string;
  readonly nameLocked?: boolean;
  readonly type: string | number;
  readonly shape?: number;
  readonly link: ComfyuiWorkflowLinkId | null;
  readonly dir?: number;
  readonly widget?: { readonly name: "seed" };
}

export interface ComfyuiWorkflowNodeOutput {
  readonly name: string;
  readonly nameLocked?: boolean;
  readonly type: string | number;
  readonly shape?: number;
  readonly slot_index?: number;
  readonly links: readonly ComfyuiWorkflowLinkId[] | null;
}

export interface ComfyuiWorkflowNodeData {
  readonly id: ComfyuiWorkflowNodeId;
  readonly type: string;
  readonly pos: readonly [x: number, y: number];
  readonly size: readonly [width: number, height: number];
  readonly flags: Record<string, unknown>;
  readonly order: number;
  readonly mode: number;
  readonly inputs: readonly ComfyuiWorkflowNodeInput[];
  readonly outputs: readonly ComfyuiWorkflowNodeOutput[];
  readonly properties: {
    readonly cnr_id?: string;
    readonly ver?: string;
    readonly "Node name for S&R"?: string;
    readonly ue_properties?: {
      readonly version: string;
      readonly widget_ue_connectable: Record<string, boolean>;
    };
    readonly [key: string]: unknown;
  };
  readonly widgets_values: readonly unknown[];
  readonly title?: string;
  readonly color?: string;
  readonly bgcolor?: string;
}

export type ComfyuiWorkflowLink = readonly [
  linkId: ComfyuiWorkflowLinkId,
  fromNodeId: ComfyuiWorkflowNodeId,
  fromOutputIndex: number,
  toNodeId: ComfyuiWorkflowNodeId,
  toInputIndex: number,
  type: ComfyuiType,
];

export interface ComfyuiWorkflowGroup {
  readonly id: number;
  readonly title: string;
  readonly bounding: readonly [number, number, number, number];
  readonly color: string;
  readonly font_size: number;
  readonly flags: Record<string, unknown>;
}

export interface ComfyuiWorkflow {
  readonly id: ComfyuiWorkflowId;
  readonly revision: number;
  readonly last_node_id: ComfyuiWorkflowNodeId;
  readonly last_link_id: ComfyuiWorkflowLinkId;
  readonly nodes: readonly ComfyuiWorkflowNodeData[];
  readonly links: readonly ComfyuiWorkflowLink[];
  readonly groups: readonly ComfyuiWorkflowGroup[];
  readonly config: Record<string, unknown>;
  readonly extra: {
    readonly ds: {
      scale: number;
      offset: readonly [x: number, y: number];
    };
    readonly frontendVersion: string;
    readonly ue_links: any[];
    readonly links_added_by_ue: any[];
  };
  readonly version: number;
  readonly widget_idx_map: Record<string, Record<string, number>>;
  readonly seed_widgets: Record<string, number>;
}

export function inputNodeNameFromLink(
  [, nodeId]: ComfyuiWorkflowLink,
  nodes: Record<ComfyuiWorkflowNodeId, ComfyuiWorkflowNodeData>,
  prompt: Record<ComfyuiWorkflowNodeId, ComfyuiPromptNodeData>,
) {
  const node = nodes[nodeId];
  return (
    prompt[node?.id ?? (0 as ComfyuiWorkflowNodeId)]?._meta.title ?? node?.type
  );
}

export function inputNodeOutputFromLink(
  [, nodeId, outputIndex]: ComfyuiWorkflowLink,
  nodes: Record<ComfyuiWorkflowNodeId, ComfyuiWorkflowNodeData>,
) {
  return nodes[nodeId]?.outputs[outputIndex];
}

export function outputNodeNameFromLink(
  [, , , nodeId]: ComfyuiWorkflowLink,
  nodes: Record<ComfyuiWorkflowNodeId, ComfyuiWorkflowNodeData>,
) {
  return nodes[nodeId]?.type;
}

export function outputNodeInputFromLink(
  [, , , nodeId, inputIndex]: ComfyuiWorkflowLink,
  nodes: Record<ComfyuiWorkflowNodeId, ComfyuiWorkflowNodeData>,
) {
  return nodes[nodeId]?.inputs[inputIndex];
}

export function promptContent(
  nodes: Record<ComfyuiWorkflowNodeId, ComfyuiWorkflowNodeData>,
  links: Record<ComfyuiWorkflowLinkId, ComfyuiWorkflowLink>,
  promptType: "positive" | "negative",
  samplerNode?: ComfyuiWorkflowNodeData,
): string | undefined {
  // If the sampler node is undefined, search for a node with Sampler in its type
  if (!samplerNode) {
    for (const node of Object.values(nodes)) {
      if (node.type.includes("Sampler")) {
        samplerNode = node;
        break;
      }
    }
  }
  if (!samplerNode) return;
  let prompt = samplerNode.inputs.find((input) => input.name === promptType);
  if (!prompt?.link) {
    // Some workflows have a few nodes in between the sampler and the prompt.
    // They should be handled individually as more workflows are analyzed.
    const pipeNode = samplerNode.inputs.find((input) =>
      input.name.includes("pipe"),
    );
    if (!pipeNode?.link) return;
    const pipeLink = links[pipeNode.link];
    if (!pipeLink) return;
    const [, nodeId] = pipeLink;
    const node = nodes[nodeId];
    if (!node) return;
    prompt = node.inputs.find((input) => input.name === promptType);
    if (!prompt?.link) return;
  }
  const link = links[prompt.link];
  if (!link) return;
  // Search through linked nodes to find the prompt string
  const [, nodeId] = link;
  let node = nodes[nodeId];
  if (!node) return;
  // For now assume the workflow is simple and the prompt is directly connected
  if (!/clip/i.test(node.type)) return;
  const value = node.widgets_values[0];
  if (typeof value === "string") return value;
}
