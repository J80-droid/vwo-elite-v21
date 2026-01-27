import type { Code } from "mdast";
import type { Handler } from "mdast-util-to-hast";

export const code: Handler = (state, node: Code) => {
  const value = node.value ? node.value + "\n" : "";
  const lang = node.lang ? node.lang.match(/^[^ \t]+(?=[ \t]|$)/) : null;
  const props: Record<string, unknown> = {};

  if (lang) {
    props.className = ["language-" + lang];
  }

  // ELITE: Metadata Preservation
  // Save metadata to the data property so rehype plugins (like shiki) can access it
  const data = node.data || (node.data = {});
  if (node.meta) {
    data.meta = node.meta;
  }

  // ELITE: Accessibility
  // Add tabindex="0" to the pre tag to make it scrollable via keyboard
  return {
    type: "element",
    tagName: "pre",
    properties: {
      tabIndex: 0,
      className: ["code-block-wrapper"], // Helper class for styling
    },
    children: [
      {
        type: "element",
        tagName: "code",
        properties: props,
        children: [{ type: "text", value }],
        data: { meta: node.meta }, // Pass meta explicitly to the code element data
      },
    ],
  };
};
