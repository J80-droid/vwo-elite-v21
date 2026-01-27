import type { Blockquote } from "mdast";
import type { Handler } from "mdast-util-to-hast";

export const blockquote: Handler = (state, node: Blockquote) => {
  // ELITE: Ensure children are wrapped properly (true flag)
  const children = state.wrap(node.children, true);

  return {
    type: "element",
    tagName: "blockquote",
    properties: {
      className: ["elite-blockquote"], // Add consistent class for styling
    },
    children,
  };
};
