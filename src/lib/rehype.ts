import type { rehype } from "rehype";
import { visit } from "unist-util-visit";

type RehypeRoot = ReturnType<NonNullable<(typeof rehype)["parser"]>>;

export function rehypeRemoveScripts() {
  return (tree: RehypeRoot) => {
    visit(tree, "element", (node, index, parent) => {
      switch (node.tagName) {
        case "script": {
          if (parent && index !== undefined) {
            parent.children.splice(index, 1);
          }
          break;
        }
        // It is unavoidable to block tracking pixels without also breaking all images.
      }
      delete node.properties.action;
      delete node.properties.formaction;
      for (const k in node.properties) {
        // Remove all event handlers (`on*` attributes)
        if (k.startsWith("on")) {
          delete node.properties[k];
        }
      }
    });
  };
}

export function rehypeRemoveAutoplay() {
  return (tree: RehypeRoot) => {
    visit(tree, "element", (node) => {
      switch (node.tagName) {
        case "video":
        case "audio": {
          delete node.properties?.autoPlay;
          break;
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

export function rehypeRemoveInteractiveElements() {
  return (tree: RehypeRoot) => {
    visit(tree, "element", (node, index, parent) => {
      switch (node.tagName) {
        case "input": {
          if (parent && index !== undefined) {
            parent.children.splice(index, 1);
          }
          break;
        }
        case "form":
        case "button": {
          if (parent && index !== undefined) {
            parent.children.splice(index, 1, ...node.children);
          }
          break;
        }
      }
    });
  };
}
