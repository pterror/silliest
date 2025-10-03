import { unsafeKeys, unsafeMapEntries } from "../../lib/object";
import { regexEscape } from "../../lib/regex";

interface LineProcessorContext {
  readonly name?: string;
}

type LineProcessorFunction = (
  line: string,
  context: LineProcessorContext,
) => string | undefined;

const SMART_QUOTE_REPLACEMENTS: Record<string, string> = {
  "‘": "'",
  "’": "'",
  "“": '"',
  "”": '"',
  "«": '"',
  "»": '"',
};

const FIELD_NAME_REPLACEMENTS: Record<string, string> = {
  tall: "Height",
  "nick name": "Nickname",
  character: "Name",
};

type LineProcessorName = keyof typeof LINE_PROCESSOR_FUNCTIONS;
const LINE_PROCESSOR_FUNCTIONS = {
  "Remove Preset Instructions": (line) => {
    if (line === "") return line;
    line = line.replace(
      /\s*\[?[^[\]]*?\b(?:OpenAI|char[}]?[}]?\s*will\s+not|roleplay\s+ignores|roleplay\s+allows|never\s+speak|not\s+speak|may\s+speak|only\s+speak|chat\s+replies|not\s+impersonate|don'?t\s+impersonate|only\s+reply|for\s+actions|dirty\s+talk|harsh\s+words?|vulgar\s+words?|censored\s+words?|speak\s+vulgarly|without\s+boundaries|avoid\s+repetition|avoid\s+repetitive|do\s+not\s+speak|explicit\s+content|one\s+paragraph|detailed\s+responses|deemed\s+nsfw|nsfw\s+filters|bypass\s+nsfw|controls?\s+actions|assume\s+consent|avoid\s+jargon|avoid[^\].]*formal|drive[^\].]*conversation|never[^\].]*repetition|progress[^\].]*sex|not[^\].]*allowed[^\].]*speak|progress[^\].]*scene|keep[^\].]*personality|no[^\].]*restrictions|no[^\].]*censorship|not[^\].]*restrict|not[^\].]*censor|not[^\].]*consent|nsfw[^\].]*allowed|engage[^\].]*roleplay|\d[^\].]*tokens|dialogue[^\].]*perverse|dialogue[^\].]*debauched|dialogue[^\].]*erotic|flowery[^\].]*eloquent|flowery[^\].]*dramatic|explicit[^\].]*uncensored|do[^\].]*emojis|is[^\].]*scenario|focus[^\].]*dialogues?|write[^\]]*moans)\b[^[\]]*?\]\s*|\s*[^.]*\b(?:OpenAI|char[}]?[}]?\s*will\s+not|roleplay\s+ignores|roleplay\s+allows|never\s+speak|not\s+speak|may\s+speak|only\s+speak|chat\s+replies|not\s+impersonate|don'?t\s+impersonate|only\s+reply|for\s+actions|dirty\s+talk|harsh\s+words?|vulgar\s+words?|censored\s+words?|speak\s+vulgarly|without\s+boundaries|avoid\s+repetition|avoid\s+repetitive|do\s+not\s+speak|explicit\s+content|one\s+paragraph|detailed\s+responses|deemed\s+nsfw|nsfw\s+filters|bypass\s+nsfw|controls?\s+actions|assume\s+consent|avoid\s+jargon|avoid[^\].]*formal|drive[^\].]*conversation|never[^\].]*repetition|progress[^\].]*sex|not[^\].]*allowed[^\].]*speak|progress[^\].]*scene|keep[^\].]*personality|no[^\].]*restrictions|no[^\].]*censorship|not[^\].]*restrict|not[^\].]*censor|not[^\].]*consent|nsfw[^\].]*allowed|engage[^\].]*roleplay|\d[^\].]*tokens|dialogue[^\].]*perverse|dialogue[^\].]*debauched|dialogue[^\].]*erotic|flowery[^\].]*eloquent|flowery[^\].]*dramatic|explicit[^\].]*uncensored|do[^\].]*emojis|is[^\].]*scenario|focus[^\].]*dialogues?)\b[^.]*[.]?\s*/gi,
      "",
    );
    return line === "" ? undefined : line;
  },
  "Remove W++": (line) => {
    const match =
      line.match(
        /^\s*\[?([^=:[\]()]+?)\s*(?:[:=]?\s*[([]|[:=])\s*([^)]*?)"?[\])\s.,;]*$/,
      ) ?? line.match(/^\s*\[([^=:[\]()]+?)\s*[:=]\s*([^\]]*?)"?[\]\s.,;]*$/);
    if (!match) return line;
    const [, name = "", rest = ""] = match;
    const values = rest
      .split("+")
      .map((word) => word.replace(/^\s*["“”]?\s*|\s*["“”]?\s*$/g, ""));
    return `${name}: ${values.join(", ")}`;
  },
  "Normalize Field Names": (line) => {
    const match = line.match(/^\s*([^:]+?):\s*(.*)$/);
    if (!match) return line;
    const [, name = "", rest = ""] = match;
    return `${FIELD_NAME_REPLACEMENTS[name.toLowerCase()] ?? name}: ${rest}`;
  },
  "Strip {{char}} Field Prefix": (line) =>
    line.replace(
      /^\s*{{char}}'?s?_?\s*(.+)\s*:/,
      (_m, fieldName: string) =>
        `${fieldName.replace(/^./, (m) => m.toUpperCase())}:`,
    ),
  "Strip 'Character' Field Prefix": (line) =>
    line.replace(
      /^\s*character'?s?_?\s*(.+)\s*:/,
      (_m, fieldName: string) =>
        `${fieldName.replace(/^./, (m) => m.toUpperCase())}:`,
    ),
  "Capitalize Field Names": (line) => {
    const match = line.match(/^\s*([^:]+?):\s*(.*)$/);
    if (!match) return line;
    const [, name = "", rest = ""] = match;
    return `${name[0]?.toUpperCase() + name.slice(1)}: ${rest}`;
  },
  "Use Sentence Case": (line): string =>
    line.replace(/^.|(?<=^[\w\s]*:\s*).|[.]\s+(.)/g, (c) => c.toUpperCase()),
  "Remove Narration Instructions": (line) => {
    if (line === "") return line;
    line = line.replace(/\s*\[\s*narration\b.*?\]\s*/gi, "");
    return line === "" ? undefined : line;
  },
  "Strip Leading Whitespace": (line) => line.replace(/^\s*/, ""),
  "Strip Trailing Whitespace": (line) => line.replace(/\s*$/, ""),
  "Strip Trailing Semicolon": (line) => line.replace(/\s*;\s*$/, ""),
  "Remove Bold and Italics Around Dialogue": (line) =>
    line.replace(/([*]+)"(.+?)"\1$/, '"$2"'),
  "Replace Character Field Name With Name": (line) =>
    line.replace(/^\s*{{char}}'?s?\s*:/, "Name:"),
  "Replace Smart Quotes": (line) =>
    line.replace(/[’]g/, (match) => SMART_QUOTE_REPLACEMENTS[match] ?? match),
  "Replace Hyphens": (line) => line.replace(/[–—−―‑‒⁃]/g, "-"),
  "Replace Bullet Points": (line) => line.replace(/^(\s*)[•]\s*/, "$1- "),
  "Human Readable Field Name": (line) =>
    line.replace(
      /^\s*([^:[\]()]+?)\s*:/,
      (_m, fieldName: string) => `${fieldName.replace(/_+/g, " ")}:`,
    ),
  "Replace Name With {{char}}": (line, { name }) =>
    name === undefined
      ? line
      : line.replace(
          new RegExp("\\b" + regexEscape(name) + "\\b", "gi"),
          "{{char}}",
        ),
  "Strip Empty Lines": (line) => (line === "" ? undefined : line),
  "Remove Horizontal Rules": (line) =>
    /^\s*---+\s*$/.test(line) ? undefined : line,
  "Remove Species: Human": (line) =>
    /^\s*species:\s*human(?:[/\w]*)\s*$/i.test(line) ? undefined : line,
  // The following are no-ops because they do not operate on individual lines.
  // They are handled separately in the `desloppify` function.
  "Strip Surrounding Whitespace": (line) => line,
  "Inject Newlines Between Fields": (line) => line,
  "Collapse Adjacent Newlines": (line) => line,
} satisfies Record<string, LineProcessorFunction>;

export const ALL_LINE_PROCESSORS = unsafeKeys(LINE_PROCESSOR_FUNCTIONS);

export type LineProcessorsConfiguration = Record<LineProcessorName, boolean>;

const DEFAULT_LINE_PROCESSORS_ARRAY: readonly LineProcessorName[] = [
  "Remove W++",
  "Normalize Field Names",
  "Replace Character Field Name With Name",
  "Human Readable Field Name",
  "Strip {{char}} Field Prefix",
  "Strip 'Character' Field Prefix",
  "Capitalize Field Names",
  "Use Sentence Case",
  "Remove Preset Instructions",
  "Remove Narration Instructions",
  "Strip Leading Whitespace",
  "Strip Trailing Whitespace",
  "Strip Trailing Semicolon",
  "Remove Bold and Italics Around Dialogue",
  "Replace Smart Quotes",
  "Replace Hyphens",
  "Replace Bullet Points",
  "Remove Species: Human",
  "Replace Name With {{char}}",
  "Strip Surrounding Whitespace",
  "Inject Newlines Between Fields",
  "Collapse Adjacent Newlines",
];

export const DEFAULT_LINE_PROCESSORS: LineProcessorsConfiguration =
  Object.freeze(
    unsafeMapEntries(LINE_PROCESSOR_FUNCTIONS, ([k]) =>
      DEFAULT_LINE_PROCESSORS_ARRAY.includes(k),
    ),
  );

type LineProcessor = keyof typeof LINE_PROCESSOR_FUNCTIONS;

interface DesloppifyOptions {
  readonly name?: string;
  readonly lineProcessors?: readonly LineProcessor[];
}

export const desloppify = (
  definitions: string,
  {
    name,
    lineProcessors = DEFAULT_LINE_PROCESSORS_ARRAY,
  }: DesloppifyOptions = {},
): string => {
  const context: LineProcessorContext = name !== undefined ? { name } : {};
  if (lineProcessors.includes("Inject Newlines Between Fields")) {
    definitions = definitions.replace(
      /(?<=[)]) (Name|Personality|Description|Body|Clothes|Clothing|Outfit|Likes|Dislikes|Way|Sexuality)/gi,
      "\n$1",
    );
  }
  const lines = definitions.split("\n");
  const processedLines = lines.flatMap((line) => {
    let finalLine = line;
    for (const processorName of lineProcessors) {
      const processor: LineProcessorFunction =
        LINE_PROCESSOR_FUNCTIONS[processorName];
      if (!processor) continue;
      const newLine = processor(finalLine, context);
      if (newLine === undefined) return [];
      finalLine = newLine;
    }
    return [finalLine];
  });
  let result = processedLines.join("\n");
  if (lineProcessors.includes("Strip Surrounding Whitespace")) {
    result = result.replace(/^\s+|\s+$/g, "");
  }
  if (lineProcessors.includes("Collapse Adjacent Newlines")) {
    result = result.replace(/\s*\n\s*\n\s*\n\s*/g, "\n\n");
  }
  return result;
};
