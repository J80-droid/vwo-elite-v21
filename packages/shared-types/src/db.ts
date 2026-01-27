export interface DocumentMeta {
  id: string;
  title: string;
  uploadDate: string; // ISO String
  status: "indexing" | "indexed" | "failed";
  path?: string;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  text: string;
  vector?: number[]; // Float32Array is often passed as number[] in JSON
  pageNumber: number;
  chunkIndex: number;
  totalChunks: number;
  bbox?: number[]; // [x, y, w, h] for highlighting on PDF
}

export interface DocSearchResult extends DocumentChunk {
  score: number;
  metadata?: DocumentMeta;
}
