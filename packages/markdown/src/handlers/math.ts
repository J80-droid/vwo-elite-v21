import type { Handler } from "mdast-util-to-hast";

// Define custom interfaces as they might not be in standard mdast
interface MathNode {
  type: "math" | "inlineMath";
  value: string;
  data?: {
    hName?: string;
    hProperties?: Record<string, unknown>;
  };
}

export const math: Handler = (state, node: unknown) => {
  const mathNode = node as MathNode;
  const isInline = mathNode.type === "inlineMath";

  // Create a wrapper that rehype-katex can pick up
  // Usually rehype-katex expects specific classes or just raw text to process
  return {
    type: "element",
    tagName: isInline ? "span" : "div",
    properties: {
      className: [isInline ? "math-inline" : "math-display"],
    },
    children: [{ type: "text", value: mathNode.value }],
  };
};
