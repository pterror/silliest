import { unsafeKeys, unsafeMapEntries } from "../../lib/object";
import { regexEscape } from "../../lib/regex";

interface Entry {
  readonly name: string;
  readonly values: readonly string[];
}

interface ProcessResult {
  readonly formatName: string;
  readonly original: string;
  readonly replaced: string;
}

interface LineProcessorContext {
  readonly name?: string;
}

type LineProcessorFunction = (
  line: string,
  context: LineProcessorContext
) => string | undefined;

type LineProcessorName = keyof typeof LINE_PROCESSOR_FUNCTIONS;
const LINE_PROCESSOR_FUNCTIONS = {
  "Remove W++": (line) => {
    const match = line.match(
      /^\s*([^:\[\]()]+?)\s*:?\s*\(([^\)]*?)[\)\s.,;]*$/
    );
    if (!match) return line;
    const [, name = "", rest = ""] = match;
    const values = rest
      .split("+")
      .map((word) => word.replace(/^\s*"?\s*|\s*"?\s*$/g, ""));
    return `${name}: ${values.join(", ")}`;
  },
  "Strip {{char}} Field Prefix": (line) =>
    line.replace(
      /^\s*{{char}}'?s?\s*(.+)\s*:/,
      (_m, fieldName: string) =>
        `${fieldName.replace(/^./, (m) => m.toUpperCase())}:`
    ),
  "Use Sentence Case": (line): string =>
    line.replace(/^.|(?<=^[\w\s]*:\s*).|[.]\s+(.)/g, (c) => c.toUpperCase()),
  "Remove Preset Instructions": (line) => {
    if (line === "") return line;
    line = line.replace(/\s*\[.*?\bnever speak\b.*?\]\s*/gi, "");
    return line === "" ? undefined : line;
  },
  "Remove Narration Instructions": (line) => {
    if (line === "") return line;
    line = line.replace(/\s*\[\s*narration\b.*?\]\s*/gi, "");
    return line === "" ? undefined : line;
  },
  "Basic Spell Check": (line) =>
    line.replace(/\b(manga|otaku|anime)s\b/gi, "$1"),
  "Strip Trailing Semicolon": (line) => line.replace(/\s*;\s*$/, ""),
  "Replace Character Field Name With Name": (line) =>
    line.replace(/^\s*{{char}}'?s?\s*:/, "Name:"),
  "Human Readable Field Name": (line) =>
    line.replace(
      /^\s*([^:\[\]()]+?)\s*:/,
      (_m, fieldName: string) => `${fieldName.replace(/_+/g, " ")}:`
    ),
  "Replace Name With {{char}}": (line, { name }) =>
    name === undefined
      ? line
      : line.replace(
          new RegExp("\\b" + regexEscape(name) + "\\b", "gi"),
          "{{char}}"
        ),
  "Strip Empty Lines": (line) => (line === "" ? undefined : line),
  "Remove Horizontal Rules": (line) =>
    /^\s*---+\s*$/.test(line) ? undefined : line,
} satisfies Record<string, LineProcessorFunction>;

export const ALL_LINE_PROCESSORS = unsafeKeys(LINE_PROCESSOR_FUNCTIONS);

export type LineProcessorsConfiguration = Record<LineProcessorName, boolean>;

const DEFAULT_LINE_PROCESSORS_ARRAY: readonly LineProcessorName[] = [
  "Remove W++",
  "Use Sentence Case",
  "Remove Preset Instructions",
  "Remove Narration Instructions",
  "Strip Trailing Semicolon",
  "Basic Spell Check",
  "Replace Character Field Name With Name",
  "Human Readable Field Name",
  "Strip {{char}} Field Prefix",
  "Replace Name With {{char}}",
];

export const DEFAULT_LINE_PROCESSORS: LineProcessorsConfiguration =
  Object.freeze(
    unsafeMapEntries(LINE_PROCESSOR_FUNCTIONS, ([k]) =>
      DEFAULT_LINE_PROCESSORS_ARRAY.includes(k)
    )
  );

type LineProcessor = keyof typeof LINE_PROCESSOR_FUNCTIONS;

interface DesloppifyOptions {
  readonly name?: string;
  readonly lineProcessors?: readonly LineProcessor[];
  /** @default true */
  readonly stripSurroundingWhitespace?: boolean;
  /** @default true */
  readonly injectNewlinesBetweenFields?: boolean;
  /** @default false */
  readonly collapseAdjacentNewlines?: boolean;
}

export const desloppify = (
  definitions: string,
  {
    name,
    lineProcessors = DEFAULT_LINE_PROCESSORS_ARRAY,
    stripSurroundingWhitespace = true,
    injectNewlinesBetweenFields = true,
    collapseAdjacentNewlines = false,
  }: DesloppifyOptions = {}
): string => {
  const context: LineProcessorContext = {
    ...(name !== undefined ? { name } : {}),
  };
  if (injectNewlinesBetweenFields) {
    definitions = definitions.replace(
      /(?<=[)]) (Name|Personality|Description|Body|Clothes|Clothing|Outfit|Likes|Dislikes|Way|Sexuality)/gi,
      "\n$1"
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
  if (stripSurroundingWhitespace) {
    result = result.replace(/^\s+|\s+$/g, "");
  }
  if (collapseAdjacentNewlines) {
    result = result.replace(/\s*\n\s*\n\s*/, "\n");
  }
  return result;
};
