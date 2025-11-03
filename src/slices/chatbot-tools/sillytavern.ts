import type { JsonString } from "../../lib/json";
import type { CharacterBook, CharacterBookEntry } from "./types";

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

export interface SillyTavernLorebookEntryCharacterFilter {
  readonly isExclude: boolean;
  readonly names: readonly string[];
  readonly tags: readonly string[];
}

export interface SillyTavernLorebookEntry {
  readonly uid: number;
  readonly key?: readonly string[];
  readonly keysecondary?: readonly string[];
  readonly comment?: string;
  readonly content: string;
  readonly constant?: boolean;
  readonly vectorized?: boolean;
  readonly selective?: boolean;
  readonly selectiveLogic?: number;
  readonly addMemo?: boolean;
  readonly order?: number;
  readonly position?: number;
  readonly disable?: boolean;
  readonly ignoreBudget?: boolean;
  readonly excludeRecursion?: boolean;
  readonly preventRecursion?: boolean;
  readonly matchPersonaDescription?: boolean;
  readonly matchCharacterDescription?: boolean;
  readonly matchCharacterPersonality?: boolean;
  readonly matchCharacterDepthPrompt?: boolean;
  readonly matchScenario?: boolean;
  readonly matchCreatorNotes?: boolean;
  readonly delayUntilRecursion?: boolean;
  readonly probability?: number;
  readonly useProbability?: boolean;
  readonly depth?: number;
  readonly group?: string;
  readonly groupOverride?: boolean;
  readonly groupWeight?: number;
  readonly scanDepth?: number | null;
  readonly caseSensitive?: boolean | null;
  readonly matchWholeWords?: boolean | null;
  readonly useGroupScoring?: boolean | null;
  readonly automationId?: string;
  readonly role?: number | null;
  readonly sticky?: number;
  readonly cooldown?: number;
  readonly delay?: number;
  readonly triggers?: readonly string[];
  readonly displayIndex?: number;
  readonly characterFilter?: SillyTavernLorebookEntryCharacterFilter;
  readonly outletName?: string;
}

export interface SillyTavernLorebook {
  readonly entries: Record<`${number}`, SillyTavernLorebookEntry>;
}

export const mergeSillyTavernLorebooks = (
  lorebooks: readonly SillyTavernLorebook[],
): SillyTavernLorebook => {
  const mergedEntries: Record<`${number}`, SillyTavernLorebookEntry> = {};
  let maxSeenUid = 0;
  for (const lorebook of lorebooks) {
    for (const entry of Object.values(lorebook.entries)) {
      const newEntry =
        entry.uid in mergedEntries ? { ...entry, uid: maxSeenUid + 1 } : entry;
      mergedEntries[`${newEntry.uid}`] = newEntry;
      if (newEntry.uid > maxSeenUid) {
        maxSeenUid = newEntry.uid;
      }
    }
  }
  return { entries: mergedEntries };
};

export type AnyLorebook = CharacterBook | SillyTavernLorebook;

export const characterBookToSillyTavernLorebook = (
  characterBook: CharacterBook,
): SillyTavernLorebook => {
  const entries: Record<`${number}`, SillyTavernLorebookEntry> = {};
  let uidCounter = 0;
  for (const entry of characterBook.entries) {
    entries[`${uidCounter}`] = {
      uid: uidCounter,
      key: entry.keys,
      content: entry.content,
      disable: !entry.enabled,
      order: entry.insertion_order,
      ...(entry.case_sensitive != null && {
        caseSensitive: entry.case_sensitive,
      }),
      ...(entry.secondary_keys != null && {
        keysecondary: entry.secondary_keys,
      }),
    };
    uidCounter += 1;
  }
  return { entries };
};

export const toSillyTavernLorebook = (
  lorebook: AnyLorebook,
): SillyTavernLorebook =>
  "extensions" in lorebook
    ? characterBookToSillyTavernLorebook(lorebook)
    : lorebook;

export const sillyTavernLorebookToCharacterBook = (
  lorebook: SillyTavernLorebook,
): CharacterBook => {
  const entries: CharacterBookEntry[] = [];
  let idCounter = 0;
  for (const entry of Object.values(lorebook.entries)) {
    entries.push({
      id: idCounter,
      keys: entry.key ?? [],
      content: entry.content,
      extensions: {},
      enabled: !entry.disable,
      insertion_order: entry.order ?? 100,
      ...(entry.constant != null && { constant: entry.constant }),
      ...(entry.caseSensitive != null && {
        case_sensitive: entry.caseSensitive,
      }),
    });
    idCounter += 1;
  }
  return { extensions: {}, entries };
};

export const toCharacterBook = (lorebook: AnyLorebook): CharacterBook =>
  "extensions" in lorebook
    ? lorebook
    : sillyTavernLorebookToCharacterBook(lorebook);
