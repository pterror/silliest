import { unsafeKeys, unsafeMapEntries } from "../../lib/object";

interface Entry {
  readonly name: string;
  readonly values: readonly string[];
}

interface Format {
  readonly name: string;
  readonly regex: RegExp;
  readonly processMatch: (match: RegExpMatchArray) => Entry;
}

interface ProcessResult {
  readonly formatName: string;
  readonly original: string;
  readonly replaced: string;
}

type InputFormatName = (typeof lineInputFormats)[number]["name"];
const lineInputFormats: readonly Format[] = [
  {
    name: "W++",
    regex: /^\s*([^:\[\]()]+?)\s*:?\s*\(([^\)]*?)[\)\s.,;]*$/,
    processMatch: ([, name = "", rest = ""]) => ({
      name,
      values: rest
        .split("+")
        .map((word) => word.replace(/^\s*"?\s*|\s*"?\s*$/g, "")),
    }),
  },
] as const;

type OutputFormatName = (typeof lineOutputFormats)[number]["name"];
const lineOutputFormats = [
  {
    name: "Standard",
    formatEntry: ({ name, values }: Entry): string =>
      `${name}: ${values.join(", ")}`,
  },
] as const;

type LineProcessorName = keyof typeof LINE_PROCESSOR_FUNCTIONS;
const LINE_PROCESSOR_FUNCTIONS = {
  "Strip Character Field Prefix": (line) =>
    line.replace(
      /^\s*{{char}}\s*(.+)\s*:/,
      (_m, fieldName: string) =>
        `${fieldName.replace(/^./, (m) => m.toUpperCase())}:`
    ),
  "Use Sentence Case": (line): string =>
    line.replace(/^.|(?<=^[\w\s]*:\s*).|[.]\s+(.)/g, (c) => c.toUpperCase()),
  "Strip Empty Lines": (line) => (line === "" ? undefined : line),
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
    line.replace(/^\s*{{char}}\s*:/, "Name:"),
  "Human Readable Field Name": (line) =>
    line.replace(
      /^\s*([^:\[\]()]+?)\s*:/,
      (_m, fieldName: string) => `${fieldName.replace(/_+/g, " ")}:`
    ),
  "Remove Horizontal Rules": (line) =>
    /^\s*---+\s*$/.test(line) ? undefined : line,
} satisfies Record<string, (line: string) => string | undefined>;

export const ALL_LINE_PROCESSORS = unsafeKeys(LINE_PROCESSOR_FUNCTIONS);

export type LineProcessorsConfiguration = Record<LineProcessorName, boolean>;

const DEFAULT_LINE_PROCESSORS_ARRAY: readonly LineProcessorName[] = [
  "Use Sentence Case",
  "Remove Preset Instructions",
  "Remove Narration Instructions",
  "Strip Trailing Semicolon",
  "Basic Spell Check",
  "Replace Character Field Name With Name",
  "Human Readable Field Name",
  "Strip Character Field Prefix",
];

export const DEFAULT_LINE_PROCESSORS: LineProcessorsConfiguration =
  Object.freeze(
    unsafeMapEntries(LINE_PROCESSOR_FUNCTIONS, ([k]) =>
      DEFAULT_LINE_PROCESSORS_ARRAY.includes(k)
    )
  );

type LineProcessor = keyof typeof LINE_PROCESSOR_FUNCTIONS;

interface DesloppifyOptions {
  /** @default "Standard" */
  readonly outputFormat?: OutputFormatName;
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
    outputFormat = "Standard",
    lineProcessors = [
      "Use Sentence Case",
      "Remove Preset Instructions",
      "Remove Narration Instructions",
      "Strip Trailing Semicolon",
      "Basic Spell Check",
      "Replace Character Field Name With Name",
      "Human Readable Field Name",
      "Strip Character Field Prefix",
    ],
    stripSurroundingWhitespace = true,
    injectNewlinesBetweenFields = true,
    collapseAdjacentNewlines = false,
  }: DesloppifyOptions = {}
): string => {
  const { formatEntry } =
    lineOutputFormats.find(({ name }) => name === outputFormat) ?? {};
  if (!formatEntry) return definitions;
  if (injectNewlinesBetweenFields) {
    definitions = definitions.replace(
      /(?<=[)]) (Name|Personality|Description|Body|Clothes|Clothing|Outfit|Likes|Dislikes|Way|Sexuality)/gi,
      "\n$1"
    );
  }
  const lines = definitions.split("\n");
  const processedLines = lines
    .map((line): ProcessResult => {
      if (/^\s+$/.test(line)) {
        return { formatName: "Blank", original: line, replaced: "" };
      }
      for (const { name, regex, processMatch } of lineInputFormats) {
        const match = line.match(regex);
        if (!match) {
          continue;
        }
        const entry = processMatch(match);
        return {
          formatName: name,
          original: line,
          replaced: formatEntry(entry),
        };
      }
      return { formatName: "Unknown", original: line, replaced: line };
    })
    .flatMap<ProcessResult>((result) => {
      let finalLine = result.replaced;
      for (const processorName of lineProcessors) {
        const processor = LINE_PROCESSOR_FUNCTIONS[processorName];
        if (!processor) continue;
        const newLine = processor(finalLine);
        if (newLine === undefined) return [];
        finalLine = newLine;
      }
      return [{ ...result, replaced: finalLine }];
    });
  let result = processedLines.map((line) => line.replaced).join("\n");
  if (stripSurroundingWhitespace) {
    result = result.replace(/^\s+|\s+$/g, "");
  }
  if (collapseAdjacentNewlines) {
    result = result.replace(/\s*\n\s*\n\s*/, "\n");
  }
  return result;
};
