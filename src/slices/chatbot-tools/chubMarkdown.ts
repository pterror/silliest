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
import {
  rehypeParseInlineQuotes,
  rehypeRemoveAutoplay,
  rehypeRemoveInteractiveElements,
  rehypeRemoveScripts,
  rehypeRemoveStyles,
} from "../../lib/rehype";
import { remarkUnindent, type RehypeRoot } from "../../lib/markdown";

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

function rehypeImageLightbox() {
  return (tree: RehypeRoot) => {
    visit(tree, "element", (node) => {
      if (node.tagName === "img") {
        node.properties.onclick =
          'const img = event.target; if (img && img.src) { const customEvent = new CustomEvent("chub-image-click", { detail: img.src }); window.dispatchEvent(customEvent); }';
      }
    });
  };
}

function rehypeReplaceMacros(macros: Record<string, string> | undefined) {
  return (tree: RehypeRoot) => {
    if (!macros || Object.keys(macros).length === 0) return;
    visit(tree, "text", (node, index, parent) => {
      const parts = node.value.match(/{{(?:.*?)}}|[^{]+|[{]/g) ?? [];
      const newChildren: NonNullable<typeof parent>["children"] = [];
      for (const part of parts) {
        const macroMatch = part.match(/^{{(.*?)}}$/);
        if (macroMatch) {
          const macroName = macroMatch[1];
          if (macroName && macros[macroName]) {
            newChildren.push({
              type: "element",
              tagName: "span",
              properties: {
                className: `chub-card-macro chub-card-macro-${macroName}`,
              },
              children: [{ type: "text", value: macros[macroName] }],
            });
          } else {
            newChildren.push({ type: "text", value: part });
          }
        } else {
          newChildren.push({ type: "text", value: part });
        }
      }
      if (parent && typeof index === "number") {
        parent.children.splice(index, 1, ...newChildren);
      }
    });
  };
}

const markdownToHtmlUnsafeProcessor = () =>
  unified()
    .use(remarkParse)
    .use(remarkUnindent)
    .use(remarkBreaks)
    .use(remarkGfm)
    .use(remarkRehype, {
      allowDangerousHtml: true,
    } satisfies RemarkRehypeOptions)
    .use(rehypeRaw)
    .use(rehypeRemoveInteractiveElements)
    .use(rehypeRemoveScripts)
    .use(rehypeReplaceChubLinks)
    .use(rehypeParseInlineQuotes)
    .use(rehypeImageLightbox)
    .use(rehypeStringify, {
      allowDangerousHtml: true,
      allowDangerousCharacters: true,
      allowParseErrors: true,
    } satisfies RehypeStringifyOptions);

const defaultMacros: Record<string, string> = {};

export function chubMarkdownToHtml(
  markdown: string,
  { unsafe = false, disableAutoplay = true, macros = defaultMacros } = {},
): string {
  const base = markdownToHtmlUnsafeProcessor();
  const base2 = unsafe ? base : base.use(rehypeRemoveStyles);
  const base3 = disableAutoplay ? base2.use(rehypeRemoveAutoplay) : base2;
  return base3
    .use(rehypeReplaceMacros, macros)
    .processSync(markdown.replace(/^#+(?=[^#\s])/gm, "$& "))
    .toString();
}
