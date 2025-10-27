import { unified, type Processor } from "unified";
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
import { gfmAutolinkLiteral } from "micromark-extension-gfm-autolink-literal";
import {
  gfmAutolinkLiteralFromMarkdown,
  gfmAutolinkLiteralToMarkdown,
} from "mdast-util-gfm-autolink-literal";
import { findAndReplace as mdastFindAndReplace } from "mdast-util-find-and-replace";

const markdownToHtmlProcessor = unified()
  .use(remarkParse)
  .use(remarkBreaks)
  .use(remarkGfm)
  .use(remarkResizableImage)
  .use(remarkRehype)
  .use(rehypeRemoveScripts)
  .use(rehypeStringify);

const markdownToHtmlUnsafeProcessor = unified()
  .use(remarkParse)
  .use(remarkBreaks)
  .use(remarkGfm)
  .use(remarkResizableImage)
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

export function remarkAutolink(this: unknown) {
  const data = (this as Processor<RemarkRoot>).data();
  (data.micromarkExtensions ??= []).push(gfmAutolinkLiteral());
  (data.fromMarkdownExtensions ??= []).push(gfmAutolinkLiteralFromMarkdown());
  (data.toMarkdownExtensions ??= []).push(gfmAutolinkLiteralToMarkdown());
}

// ![alt](url =widthxheight)
const resizableImageRegex =
  /!\[([^\]]*)\]\((.*?)\s*=\s*(\d+.+)\s*x\s*(\d+.+)\)/g;

function replacer(
  _match: string,
  alt: string,
  url: string,
  width: string,
  height: string,
) {
  return {
    type: "image" as const,
    url,
    alt,
    data: {
      // hProperties will be turned into HTML attributes
      hProperties: {
        width,
        height,
      },
    },
  };
}

export function remarkResizableImage() {
  return (tree: RemarkRoot) => {
    mdastFindAndReplace(tree, [resizableImageRegex, replacer]);
  };
}
