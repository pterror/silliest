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

export interface ComfyuiWorkflowNode {
  readonly id: ComfyuiWorkflowNodeId;
  readonly type: string;
  readonly pos: readonly [x: number, y: number];
  readonly size: readonly [width: number, height: number];
  readonly flags: Record<string, unknown>;
  readonly order: number;
  readonly mode: number;
  readonly inputs: readonly {
    readonly name: string;
    readonly nameLocked?: boolean;
    readonly type: string | number;
    readonly shape?: number;
    readonly link: number | null;
    readonly dir?: number;
    readonly widget?: { readonly name: "seed" };
  }[];
  readonly outputs: readonly {
    readonly name: string;
    readonly nameLocked?: boolean;
    readonly type: string | number;
    readonly shape?: number;
    readonly slot_index?: number;
    readonly links: readonly number[] | null;
  }[];
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
  readonly nodes: readonly ComfyuiWorkflowNode[];
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
