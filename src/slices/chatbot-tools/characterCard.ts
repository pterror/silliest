import { regexEscape } from "../../lib/regex";

export const characterCardReplaceMacros = (
  value: string,
  macros: Record<string, string>,
): string =>
  value.replace(
    new RegExp(
      `\\{\\{(${Object.keys(macros)
        .map((macro) => regexEscape(macro))
        .join("|")})\\}\\}`,
      "g",
    ),
    (match, name) => macros[name] || match,
  );

export interface ChatMessage {
  readonly role: "char" | "user";
  readonly content: string;
}

export const parseExampleMessages = (
  conversations: string,
): readonly (readonly ChatMessage[])[] => {
  const conversationsArray = conversations.split(/<START>/g);
  if (conversationsArray[0]?.trim() === "") {
    conversationsArray.shift();
  }
  return conversationsArray
    .map((conversation) => conversation.replace(/<END>/g, "").trim())
    .map((conversation) => {
      // Messages from the model and user are prefixed with {{char}}: and {{user}}: respectively.
      // We need to extract that information to form a proper chat message.
      const messages = conversation.match(
        /(?:(?<=^|[\r\n])\{\{(char|user)\}\}:|^)[\s\S]*?(?=\{\{(char|user)\}\}:|$)/g,
      );
      return messages
        ? Array.from(messages, (message): ChatMessage => {
            const role = message.startsWith("{{user}}:") ? "user" : "char";
            const content = message.replace(/^\{\{(char|user)\}\}:/, "").trim();
            return { role, content };
          })
        : [];
    });
};
