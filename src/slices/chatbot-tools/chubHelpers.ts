import type { ChubCard } from "./chub";
import type { TavernCardV2 } from "./types";

export function chubCardToTavernCard(card: ChubCard<true>): TavernCardV2 {
  return {
    spec: "chara_card_v2",
    spec_version: "2.0",
    data: {
      name: card.definition.name,
      description: card.definition.personality,
      personality: card.definition.tavern_personality,
      scenario: card.definition.scenario,
      first_mes: card.definition.first_message,
      mes_example: card.definition.example_dialogs,
      creator_notes: card.definition.description,
      system_prompt: card.definition.system_prompt,
      post_history_instructions: card.definition.post_history_instructions,
      alternate_greetings: card.definition.alternate_greetings,
      character_book: card.definition.embedded_lorebook ?? undefined,
      tags: card.topics,
      creator: card.fullPath.replace(/[/].+/, ""),
      character_version: "1.0",
      extensions: card.definition.extensions as any,
    },
  };
}

export function chubAddAuthorToUrl(author: string) {
  const url = new URL(location.href);
  url.searchParams.set("author", author);
  return url.toString();
}

export function chubAddTopicToUrl(topic: string) {
  const url = new URL(location.href);
  const existingTopics = url.searchParams.getAll("topic[]");
  if (existingTopics.includes(topic)) {
    return location.href;
  }
  url.searchParams.append("topic[]", topic);
  return url.toString();
}
