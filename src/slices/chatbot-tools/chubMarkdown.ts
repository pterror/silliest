import type { rehype } from "rehype";
import rehypeRaw from "rehype-raw";
import rehypeStringify, {
  type Options as RehypeStringifyOptions,
} from "rehype-stringify";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype, {
  type Options as RemarkRehypeOptions,
} from "remark-rehype";
import { unified } from "unified";
import { visit } from "unist-util-visit";

type RehypeRoot = ReturnType<NonNullable<(typeof rehype)["parser"]>>;

function rehypeReplaceChubLinks() {
  return (tree: RehypeRoot) => {
    visit(tree, "element", (node) => {
      if (node.tagName === "a") {
        const href = node.properties?.href;
        if (typeof href !== "string") return;
        {
          // Search for and replace links to chub.ai characters.
          const [, fullPath] =
            href.match(/https:\/\/chub\.ai\/characters\/([^/]+\/[^?]+)/) ?? [];
          if (!fullPath) return;
          const newUrl = new URL(location.href);
          newUrl.searchParams.set("card_id", `${fullPath}`);
          node.properties.href = newUrl.toString();
          return;
        }
        {
          // TODO: Search for and replace links to chub.ai users.
        }
      }
    });
  };
}

const markdownToHtmlProcessor = unified()
  .use(remarkParse)
  .use(remarkBreaks)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeReplaceChubLinks)
  .use(rehypeStringify);

const markdownToHtmlUnsafeProcessor = unified()
  .use(remarkParse)
  .use(remarkBreaks)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true } satisfies RemarkRehypeOptions)
  .use(rehypeRaw)
  .use(rehypeReplaceChubLinks)
  .use(rehypeStringify, {
    allowDangerousHtml: true,
    allowDangerousCharacters: true,
    allowParseErrors: true,
  } satisfies RehypeStringifyOptions);

export function chubMarkdownToHtml(
  markdown: string,
  { unsafe = false } = {},
): string {
  return (unsafe ? markdownToHtmlUnsafeProcessor : markdownToHtmlProcessor)
    .processSync(markdown)
    .toString();
}
