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
