// See https://github.com/malfoyslastname/character-card-spec-v2/blob/main/spec_v2.md
import { z } from "zod/v4";

export type TavernCardExtensionDepthPrompt = z.infer<
  typeof TavernCardExtensionDepthPrompt
>;
export const TavernCardExtensionDepthPrompt = z.object({
  depth: z.number(),
  prompt: z.string(),
});

export type TavernCardExtensionChubExpressionName = z.infer<
  typeof TavernCardExtensionChubExpressionName
>;
export const TavernCardExtensionChubExpressionName = z.literal([
  "joy",
  "fear",
  "love",
  "anger",
  "grief",
  "pride",
  "caring",
  "desire",
  "relief",
  "disgust",
  "neutral",
  "remorse",
  "sadness",
  "approval",
  "optimism",
  "surprise",
  "amusement",
  "annoyance",
  "confusion",
  "curiosity",
  "gratitude",
  "admiration",
  "excitement",
  "disapproval",
  "nervousness",
  "realization",
  "embarrassment",
  "disappointment",
]);

export type TavernCardExtensionChubExpressions = z.infer<
  typeof TavernCardExtensionChubExpressions
>;
export const TavernCardExtensionChubExpressions = z.object({
  version: z.string(),
  compressed: z.string(),
  is_default: z.boolean(),
  expressions: z.record(z.string(), z.string()),
});

export type TavernCardExtensionChub = z.infer<typeof TavernCardExtensionChub>;
export const TavernCardExtensionChub = z.object({
  background_image: z.union([z.string(), z.null()]).optional(),
  custom_css: z.union([z.string(), z.null()]).optional(),
  expressions: z
    .union([TavernCardExtensionChubExpressions, z.null()])
    .optional(),
  alt_expressions: z.record(z.string(), z.string()).optional(),
  extensions: z.array(z.unknown()).optional(),
  full_path: z.string(),
  id: z.number(),
  preset: z.unknown().optional(),
  related_lorebooks: z.array(z.unknown()).optional(),
});

export type TavernCardV1 = z.infer<typeof TavernCardV1>;
export const TavernCardV1 = z.object({
  name: z.string(),
  description: z.string(),
  personality: z.string(),
  scenario: z.string(),
  first_mes: z.string(),
  mes_example: z.string(),
});

export type CharacterBook = z.infer<typeof CharacterBook>;
export const CharacterBook = z.object({
  name: z.optional(z.string()),
  description: z.optional(z.string()),
  scan_depth: z.optional(z.number()), // agnai: "Memory: Chat History Depth"
  token_budget: z.optional(z.number()), // agnai: "Memory: Context Limit"
  recursive_scanning: z.optional(z.boolean()), // no agnai equivalent. whether entry content can trigger other entries
  extensions: z.record(z.string(), z.unknown()),
  entries: z.array(
    z.object({
      keys: z.array(z.string()),
      content: z.string(),
      extensions: z.record(z.string(), z.unknown()),
      enabled: z.boolean(),
      insertion_order: z.number(), // if two entries inserted, lower "insertion order" = inserted higher
      case_sensitive: z.optional(z.boolean()),

      // FIELDS WITH NO CURRENT EQUIVALENT IN SILLY
      name: z.optional(z.string()), // not used in prompt engineering
      priority: z.optional(z.number()), // if token budget reached, lower priority value = discarded first

      // FIELDS WITH NO CURRENT EQUIVALENT IN AGNAI
      id: z.optional(z.number()), // not used in prompt engineering
      comment: z.optional(z.string()), // not used in prompt engineering
      selective: z.optional(z.boolean()), // if `true`, require a key from both `keys` and `secondary_keys` to trigger the entry
      secondary_keys: z.optional(z.array(z.string())), // see field `selective`. ignored if selective == false
      constant: z.optional(z.boolean()), // if true, always inserted in the prompt (within budget limit)
      position: z.optional(z.literal(["", "before_char", "after_char"])), // whether the entry is placed before or after the character defs
    }),
  ),
});

export type TavernCardV2Extensions = z.infer<typeof TavernCardV2Extensions>;
export const TavernCardV2Extensions = z
  .object({
    depth_prompt: TavernCardExtensionDepthPrompt.optional(),
    chub: TavernCardExtensionChub.optional(),
  })
  .and(z.record(z.string(), z.unknown()));

export type TavernCardV2 = z.infer<typeof TavernCardV2>;
export const TavernCardV2 = z.object({
  spec: z.literal("chara_card_v2"),
  spec_version: z.literal("2.0"), // May 8th addition
  data: z.object({
    name: z.string(),
    description: z.string(),
    personality: z.string(),
    scenario: z.string(),
    first_mes: z.string(),
    mes_example: z.string(),

    // New fields start here
    creator_notes: z.string(),
    system_prompt: z.string(),
    post_history_instructions: z.string(),
    alternate_greetings: z.array(z.string()).readonly(),
    character_book: CharacterBook.optional(),

    // May 8th additions
    tags: z.array(z.string()).readonly(),
    creator: z.string(),
    character_version: z.string(),
    extensions: TavernCardV2Extensions,
  }),
});

export type TavernCard = z.infer<typeof TavernCard>;
export const TavernCard = z.union([TavernCardV1, TavernCardV2]);
