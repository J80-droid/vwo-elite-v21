import { blockquote } from "./handlers/blockquote";
import { hardBreak } from "./handlers/break";
import { code } from "./handlers/code";
import { emphasis, strike } from "./handlers/inline";
import { math } from "./handlers/math";

export const eliteHandlers = {
  code,
  break: hardBreak, // 'break' is a reserved word/node type
  blockquote,
  emphasis,
  delete: strike,
  math,
  inlineMath: math,
};

export * from "./handlers/blockquote";
export * from "./handlers/break";
export * from "./handlers/code";
export * from "./handlers/inline";
export * from "./handlers/math";
