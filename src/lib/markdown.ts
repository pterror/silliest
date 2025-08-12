import { unified } from "unified";
import remarkParse from "remark-parse";
import rehypeStringify, {
  type Options as RehypeStringifyOptions,
} from "rehype-stringify";
import remarkRehype, {
  type Options as RemarkRehypeOptions,
} from "remark-rehype";

const markdownToHtmlProcessor = unified()
  .use(remarkParse)
  .use(remarkRehype)
  .use(rehypeStringify);

export function markdownToHtml(markdown: string): string {
  return markdownToHtmlProcessor.processSync(markdown).toString();
}

const markdownToHtmlUnsafeProcessor = unified()
  .use(remarkParse)
  .use(remarkRehype, { allowDangerousHtml: true } satisfies RemarkRehypeOptions)
  .use(rehypeStringify, {
    allowDangerousHtml: true,
    allowDangerousCharacters: true,
    allowParseErrors: true,
  } satisfies RehypeStringifyOptions);

export function markdownToHtmlUnsafe(markdown: string): string {
  return markdownToHtmlUnsafeProcessor.processSync(markdown).toString();
}
