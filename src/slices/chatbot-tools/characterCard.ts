import { regexEscape } from "../../lib/regex";

const dateLocale = "en-US";

const macrosObjectPrototype = {
  get weekday() {
    return new Date().toLocaleDateString(dateLocale, { weekday: "long" });
  },
  get isotime() {
    return (
      new Date()
        .toISOString()
        .replace(/.*T/, "")
        .match(/\d+:\d+/)?.[0] ?? ""
    );
  },
  get isodate() {
    return new Date().toISOString().replace(/T.*/, "");
  },
  get date() {
    return new Date().toLocaleDateString(dateLocale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  },
  get time() {
    return new Date().toLocaleTimeString(dateLocale, {
      hour: "numeric",
      minute: "2-digit",
    });
  },
};

export const constructMacrosObject = ({
  user,
  char,
}: {
  user: string;
  char: string;
}) => Object.setPrototypeOf({ user, char }, macrosObjectPrototype);

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
  readonly role: "char" | "user" | "error";
  readonly content: string;
  readonly error: boolean;
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
            return {
              role,
              content,
              error: role === "char" && !message.startsWith("{{char}}:"),
            };
          })
        : [];
    });
};
