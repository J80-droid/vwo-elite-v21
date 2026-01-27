import type { Delete, Emphasis } from "mdast";
import type { Handler } from "mdast-util-to-hast";

export const emphasis: Handler = (state, node: Emphasis) => {
  return {
    type: "element",
    tagName: "em",
    properties: {},
    children: state.all(node),
  };
};

export const strike: Handler = (state, node: Delete) => {
  return {
    type: "element",
    tagName: "del", // Semantic HTML5
    properties: {},
    children: state.all(node),
  };
};
