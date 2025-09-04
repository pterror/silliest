import { unified } from "unified";
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
