// See https://github.com/malfoyslastname/character-card-spec-v2/blob/main/spec_v2.md
import {
  AllOf,
  AnyOf,
  Array,
  boolean,
  Literal,
  number,
  Object,
  Optional,
  Record,
  string,
  unknown,
  type Static,
} from "../../lib/types";

export type TavernCardExtensionDepthPrompt = Static<
  typeof TavernCardExtensionDepthPrompt
>;
export const TavernCardExtensionDepthPrompt = Object({
  depth: number,
  prompt: string,
});

export type TavernCardExtensionChub = Static<typeof TavernCardExtensionChub>;
export const TavernCardExtensionChub = Object({
  background_image: string,
  expressions: unknown,
  extensions: Array(unknown),
  full_path: string,
  id: number,
  preset: unknown,
  related_lorebooks: Array(unknown),
});

export type TavernCardV1 = Static<typeof TavernCardV1>;
export const TavernCardV1 = Object({
  name: string,
  description: string,
  personality: string,
  scenario: string,
  first_mes: string,
  mes_example: string,
});

export type CharacterBook = Static<typeof CharacterBook>;
export const CharacterBook = Object({
  name: Optional(string),
  description: Optional(string),
  scan_depth: Optional(number), // agnai: "Memory: Chat History Depth"
  token_budget: Optional(number), // agnai: "Memory: Context Limit"
  recursive_scanning: Optional(boolean), // no agnai equivalent. whether entry content can trigger other entries
  extensions: Record(string, unknown),
  entries: Array(
    Object({
      keys: Array(string),
      content: string,
      extensions: Record(string, unknown),
      enabled: boolean,
      insertion_order: number, // if two entries inserted, lower "insertion order" = inserted higher
      case_sensitive: Optional(boolean),

      // FIELDS WITH NO CURRENT EQUIVALENT IN SILLY
      name: Optional(string), // not used in prompt engineering
      priority: Optional(number), // if token budget reached, lower priority value = discarded first

      // FIELDS WITH NO CURRENT EQUIVALENT IN AGNAI
      id: Optional(number), // not used in prompt engineering
      comment: Optional(string), // not used in prompt engineering
      selective: Optional(boolean), // if `true`, require a key from both `keys` and `secondary_keys` to trigger the entry
      secondary_keys: Optional(Array(string)), // see field `selective`. ignored if selective == false
      constant: Optional(boolean), // if true, always inserted in the prompt (within budget limit)
      position: Optional(
        AnyOf(Literal(""), Literal("before_char"), Literal("after_char"))
      ), // whether the entry is placed before or after the character defs
    })
  ),
});

export const TavernCardV2Extensions = AllOf(
  Object({
    depth_prompt: Optional(TavernCardExtensionDepthPrompt),
    chub: Optional(TavernCardExtensionChub),
  }),
  Record(string, unknown)
);

export type TavernCardV2 = Static<typeof TavernCardV2>;
export const TavernCardV2 = Object({
  spec: Literal("chara_card_v2"),
  spec_version: Literal("2.0"), // May 8th addition
  data: Object({
    name: string,
    description: string,
    personality: string,
    scenario: string,
    first_mes: string,
    mes_example: string,

    // New fields start here
    creator_notes: string,
    system_prompt: string,
    post_history_instructions: string,
    alternate_greetings: Array(string),
    character_book: Optional(CharacterBook),

    // May 8th additions
    tags: Array(string),
    creator: string,
    character_version: string,
    extensions: TavernCardV2Extensions,
  }),
});

export type TavernCard = Static<typeof TavernCard>;
export const TavernCard = AnyOf(TavernCardV1, TavernCardV2);
