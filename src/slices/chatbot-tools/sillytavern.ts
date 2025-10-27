import type { JsonString } from "../../lib/json";

export interface SillyTavernChatlogBaseEntry {
  readonly name: string;
  readonly is_user: boolean;
  readonly is_system: boolean;
  readonly send_date: string;
  readonly mes: string;
  readonly extra: Record<string, any>;
  readonly force_avatar?: string;
  readonly original_avatar?: string;
  readonly is_group?: boolean;
  readonly swipe_id?: number;
  readonly swipes?: readonly string[];
}

export interface SillyTavernChapterizerData {
  readonly id: number;
  readonly name: string;
  readonly start: number;
  readonly end: number;
  readonly collapsed: boolean;
  readonly colors: {
    readonly titleBg: string;
    readonly titleText: string;
  };
}

export interface SillyTavernChatlogModelExtras {
  readonly api?: string;
  readonly model?: string;
  readonly token_count?: number;
  readonly reasoning?: string;
  readonly reasoning_duration?: number | null;
  readonly gen_id?: number;
  readonly time_to_first_token?: number;
  readonly chapterizer_data?: JsonString<readonly SillyTavernChapterizerData[]>;
  readonly [key: string]: unknown;
}

export interface SillyTavernChatlogModelEntry
  extends SillyTavernChatlogBaseEntry {
  readonly is_user: false;
  readonly is_system: false;
  readonly swipe_info?: readonly {
    readonly send_date?: string;
    readonly gen_started?: string;
    readonly gen_finished?: string;
    readonly extra?: SillyTavernChatlogModelExtras;
  }[];
}

export interface SillyTavernChatlogUserExtras {
  readonly isSmallSys?: boolean;
  readonly token_count?: number;
  readonly reasoning?: string;
  readonly bias?: string;
  readonly qvink_memory?: {
    readonly lagging?: boolean;
    readonly include?: unknown;
  };
  readonly swipe_id?: never;
  readonly swipes?: never;
  readonly [key: string]: unknown;
}

export interface SillyTavernChatlogUserEntry
  extends SillyTavernChatlogBaseEntry {
  readonly is_user: true;
  readonly is_system: false;
}

export type SillyTavernChatlogEntry =
  | SillyTavernChatlogUserEntry
  | SillyTavernChatlogModelEntry;

export type SillyTavernChatlog = readonly SillyTavernChatlogEntry[];
