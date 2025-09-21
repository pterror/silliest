import { unified } from "unified";
import type { rehype } from "rehype";
import remarkParse from "remark-parse";
import rehypeStringify, {
  type Options as RehypeStringifyOptions,
} from "rehype-stringify";
import remarkRehype, {
  type Options as RemarkRehypeOptions,
} from "remark-rehype";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { rehypeRemoveScripts } from "./rehype";
import rehypeRaw from "rehype-raw";
import { visit } from "unist-util-visit";
import type { remark } from "remark";

const markdownToHtmlProcessor = unified()
  .use(remarkParse)
  .use(remarkBreaks)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeRemoveScripts)
  .use(rehypeStringify);

const markdownToHtmlUnsafeProcessor = unified()
  .use(remarkParse)
  .use(remarkBreaks)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true } satisfies RemarkRehypeOptions)
  .use(rehypeRaw)
  .use(rehypeRemoveScripts)
  .use(rehypeStringify, {
    allowDangerousHtml: true,
    allowDangerousCharacters: true,
    allowParseErrors: true,
  } satisfies RehypeStringifyOptions);

export function markdownToHtml(
  markdown: string,
  { unsafe = false } = {},
): string {
  return (unsafe ? markdownToHtmlUnsafeProcessor : markdownToHtmlProcessor)
    .processSync(markdown)
    .toString();
}

export type RemarkRoot = ReturnType<NonNullable<(typeof remark)["parser"]>>;
export type RehypeRoot = ReturnType<NonNullable<(typeof rehype)["parser"]>>;

const htmlRegex = /<[a-z][\s\S]*>/i;

export function remarkUnindent() {
  return (tree: RemarkRoot) => {
    visit(tree, "code", (node) => {
      if (!node.lang) {
        if (htmlRegex.test(node.value)) {
          // @ts-expect-error i swear this works
          node.type = "html";
        }
      }
    });
  };
}

const isTextLikeTag: Record<string, true> = {
  p: true,
  li: true,
  h1: true,
  h2: true,
  h3: true,
  h4: true,
  h5: true,
  h6: true,
  blockquote: true,
  q: true,
  span: true,
  sub: true,
  sup: true,
  strong: true,
  em: true,
  b: true,
  i: true,
  u: true,
};

export function rehypeParseInlineQuotes() {
  return (tree: RehypeRoot) => {
    // Extract all instances of inline quotes, i.e. text wrapped in double quotes.
    // Wrap them in <q> tags.
    visit(tree, "element", (node) => {
      if (!isTextLikeTag[node.tagName]) return;
      const newChildren: NonNullable<typeof node>["children"] = [];
      let quoteChildren: NonNullable<typeof node>["children"] | undefined =
        undefined;
      for (const child of node.children) {
        if (child.type !== "text") {
          (quoteChildren ?? newChildren).push(child);
          continue;
        }
        const parts = child.value.match(/[^"]+|"/g);
        if (!parts) continue;
        for (const part of parts) {
          if (part === '"') {
            if (quoteChildren) {
              // End quote
              newChildren.push({
                type: "element",
                tagName: "q",
                properties: {},
                children: quoteChildren,
              });
              quoteChildren = undefined;
            } else {
              // Start quote
              quoteChildren = [];
            }
          } else {
            (quoteChildren ?? newChildren).push({ type: "text", value: part });
          }
        }
      }
      if (quoteChildren) {
        // Unclosed quote, assume it ends at the end of the paragraph.
        newChildren.push({
          type: "element",
          tagName: "q",
          properties: {},
          children: quoteChildren,
        });
      }
      node.children = newChildren;
    });
  };
}
