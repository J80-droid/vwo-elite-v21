import type { Handler } from "mdast-util-to-hast";

export const breakHandler: Handler = (_state, _node) => {
  return [
    { type: "element", tagName: "br", properties: {}, children: [] },
    { type: "text", value: "\n" },
  ];
};
