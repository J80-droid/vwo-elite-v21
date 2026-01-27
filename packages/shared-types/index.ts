export * from "./src/ai-brain";
export * from "./src/common";
export * from "./src/config";
export * from "./src/db";
export * from "./src/flashcards";
export * from "./src/formula";
export * from "./src/gym";
export * from "./src/i18n";
export { IpcChannels, type VwoApi } from "./src/ipc";
export * from "./src/ipc-schemas";
export * from "./src/library";
export * from "./src/mcp-protocol";
export * from "./src/mcp-protocol";
export * from "./src/planner";
export * from "./src/pws";
export * from "./src/quiz";
export * from "./src/somtodayTypes";
export * from "./src/study";
export * from "./src/user";

import { DocSearchResult, DocumentChunk, DocumentMeta } from "./src/db";

// IPC Contract Types
export interface IPCContract {
  "ai:generate": (
    payload: string | { prompt: string; options?: Record<string, unknown> },
  ) => Promise<string>;
  "ai:status": () => Promise<{ ready: boolean; port: number; pid?: number }>;
  "db:query": (sql: string, params?: unknown) => Promise<unknown[]>;
  "db:vector-search": (
    collection: string,
    vector: number[],
    limit?: number,
  ) => Promise<unknown[]>;
  "db:save-tutor-state": (state: Record<string, unknown>) => Promise<boolean>;
  "db:load-tutor-state": () => Promise<Record<string, unknown>>;
  "sys:get-hardware-tier": () => Promise<"base" | "mid" | "elite">;
  "doc:add": (meta: DocumentMeta, chunks: DocumentChunk[]) => Promise<void>;
  "doc:search": (query: string) => Promise<DocSearchResult[]>;
  "doc:delete": (id: string) => Promise<void>;
  "sys:ping": () => Promise<string>;
  "sys:open-path": (path: string) => Promise<string>;
}

export type Tier = "base" | "mid" | "elite";
