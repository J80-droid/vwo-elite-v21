/**
 * Memory Store
 * LanceDB-based vector storage for the AI Brain memory system
 *
 * Note: This implementation uses an in-memory approach that can be
 * persisted to IndexedDB for browser compatibility. For full LanceDB
 * support, a Node.js backend would be required.
 */

import type {
  MemoryType,
  SearchOptions,
  SearchResult,
  VectorDocument,
  VectorMetadata,
} from "../../types/ai-brain";
import { getEmbeddingService } from "./embeddingService";

// =============================================================================
// TRUST SCORES
// =============================================================================

export const TRUST_SCORES = {
  library: 1.0, // Uploaded books, official materials
  note: 0.85, // User's own notes
  flashcard: 0.8, // User-created flashcards
  lesson: 0.6, // AI-generated lessons (unvalidated)
  lesson_validated: 0.9, // AI lessons marked as correct
  chat_summary: 0.5, // Auto-summarized chat history
} as const;

// =============================================================================
// IN-MEMORY VECTOR STORE
// =============================================================================

/**
 * In-memory vector store with IndexedDB persistence
 * This provides LanceDB-like functionality in the browser
 */
class MemoryStore {
  private documents: Map<string, VectorDocument> = new Map();
  private isInitialized = false;
  private dbName = "vwo-elite-memory";
  private storeName = "vectors";

  // =========================
  // INITIALIZATION
  // =========================

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load from IndexedDB
      await this.loadFromIndexedDB();
      this.isInitialized = true;
      console.log(
        `[MemoryStore] Initialized with ${this.documents.size} documents`,
      );
    } catch (error) {
      console.error("[MemoryStore] Initialization failed:", error);
      // Continue with empty store
      this.isInitialized = true;
    }
  }

  // =========================
  // DOCUMENT OPERATIONS
  // =========================

  /**
   * Add a document to the store
   */
  async add(
    text: string,
    metadata: Omit<VectorMetadata, "createdAt" | "accessedAt">,
  ): Promise<string> {
    await this.ensureInitialized();

    // Generate embedding
    const embeddingService = getEmbeddingService();
    const { vector } = await embeddingService.embed(text);

    const id = this.generateId();
    const now = Date.now();

    const document: VectorDocument = {
      id,
      vector,
      text,
      metadata: {
        ...metadata,
        createdAt: now,
        accessedAt: now,
      },
    };

    this.documents.set(id, document);

    // Persist asynchronously
    this.saveToIndexedDB().catch(console.error);

    return id;
  }

  /**
   * Add multiple documents in batch
   */
  async addBatch(
    items: Array<{
      text: string;
      metadata: Omit<VectorMetadata, "createdAt" | "accessedAt">;
    }>,
  ): Promise<string[]> {
    await this.ensureInitialized();

    const embeddingService = getEmbeddingService();
    const now = Date.now();
    const ids: string[] = [];

    // Generate embeddings in batch
    const texts = items.map((item) => item.text);
    const embeddings = await embeddingService.embedBatch(texts);

    // Add documents
    for (let i = 0; i < items.length; i++) {
      const id = this.generateId();
      const document: VectorDocument = {
        id,
        vector: embeddings[i]!.vector,
        text: items[i]!.text,
        metadata: {
          ...items[i]!.metadata,
          createdAt: now,
          accessedAt: now,
        },
      };

      this.documents.set(id, document);
      ids.push(id);
    }

    // Persist asynchronously
    this.saveToIndexedDB().catch(console.error);

    return ids;
  }

  /**
   * Get a document by ID
   */
  async get(id: string): Promise<VectorDocument | null> {
    await this.ensureInitialized();
    return this.documents.get(id) || null;
  }

  /**
   * Update a document
   */
  async update(
    id: string,
    updates: Partial<{ text: string; metadata: Partial<VectorMetadata> }>,
  ): Promise<boolean> {
    await this.ensureInitialized();

    const doc = this.documents.get(id);
    if (!doc) return false;

    // If text changed, regenerate embedding
    if (updates.text && updates.text !== doc.text) {
      const embeddingService = getEmbeddingService();
      const { vector } = await embeddingService.embed(updates.text);
      doc.vector = vector;
      doc.text = updates.text;
    }

    // Update metadata
    if (updates.metadata) {
      doc.metadata = { ...doc.metadata, ...updates.metadata };
    }

    this.documents.set(id, doc);
    this.saveToIndexedDB().catch(console.error);

    return true;
  }

  /**
   * Delete a document
   */
  async delete(id: string): Promise<boolean> {
    await this.ensureInitialized();

    const deleted = this.documents.delete(id);
    if (deleted) {
      this.saveToIndexedDB().catch(console.error);
    }

    return deleted;
  }

  /**
   * Delete all documents matching a filter
   */
  async deleteWhere(filter: {
    type?: MemoryType;
    sourceId?: string;
    subject?: string;
  }): Promise<number> {
    await this.ensureInitialized();

    let count = 0;
    for (const [id, doc] of this.documents) {
      if (this.matchesFilter(doc, filter)) {
        this.documents.delete(id);
        count++;
      }
    }

    if (count > 0) {
      this.saveToIndexedDB().catch(console.error);
    }

    return count;
  }

  // =========================
  // SEARCH
  // =========================

  /**
   * Semantic search using cosine similarity
   */
  async search(
    query: string,
    options?: SearchOptions,
  ): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    // 1. Try Electron Backend (Real VWO Elite Brain)
    if (typeof window !== "undefined" && window.vwoApi) {
      try {
        console.log(
          "[MemoryStore] Delegating search to VWO Elite Brain IPC:",
          query,
        );
        const backendResults = await window.vwoApi.documents.search(query);

        // Map backend results to frontend VectorDocument format
        const mappedResults: SearchResult[] = backendResults.map((doc) => ({
          id: doc.id,
          text: doc.text,
          vector: doc.vector || [],
          score: doc.score,
          metadata: {
            type: "library", // Backend docs are usually library
            trustScore: 1.0,
            sourceId: doc.documentId,
            sourceType: "file",
            subject: doc.metadata?.title, // Use title as subject/topic proxy
            topic: doc.metadata?.title,
            validated: true,
            createdAt: Date.now(),
            accessedAt: Date.now(),
          },
        }));
        results.push(...mappedResults);
      } catch (err) {
        console.error("[MemoryStore] IPC Search failed", err);
      }
    }

    // 2. Local IndexedDB Search (Client-side notes/flashcards)
    await this.ensureInitialized();

    if (this.documents.size > 0) {
      // Generate query embedding for local search
      const embeddingService = getEmbeddingService();
      // Only run local embedding if we have local docs to search against
      // to save resources if only using backend
      const { vector: queryVector } = await embeddingService.embed(query);

      for (const doc of this.documents.values()) {
        // Apply filters
        if (!this.matchesSearchOptions(doc, options)) {
          continue;
        }

        // Calculate cosine similarity
        const score = this.cosineSimilarity(queryVector, doc.vector);

        results.push({
          ...doc,
          score,
        });

        // Update access time
        doc.metadata.accessedAt = Date.now();
      }
    }

    // Sort combined results by score (descending) and limit
    results.sort((a, b) => b.score - a.score);
    const limit = options?.limit || 20; // Increased limit default

    return results.slice(0, limit);
  }

  /**
   * Get documents by type
   */
  async getByType(type: MemoryType, limit?: number): Promise<VectorDocument[]> {
    await this.ensureInitialized();

    const results: VectorDocument[] = [];

    for (const doc of this.documents.values()) {
      if (doc.metadata.type === type) {
        results.push(doc);
        if (limit && results.length >= limit) break;
      }
    }

    return results;
  }

  /**
   * Get documents by source ID
   */
  async getBySource(sourceId: string): Promise<VectorDocument[]> {
    await this.ensureInitialized();

    const results: VectorDocument[] = [];

    for (const doc of this.documents.values()) {
      if (doc.metadata.sourceId === sourceId) {
        results.push(doc);
      }
    }

    return results;
  }

  // =========================
  // STATS
  // =========================

  async getStats(): Promise<{
    totalDocuments: number;
    byType: Record<MemoryType, number>;
    bySubject: Record<string, number>;
    totalSize: number;
  }> {
    await this.ensureInitialized();

    const byType: Record<string, number> = {};
    const bySubject: Record<string, number> = {};
    let totalSize = 0;

    for (const doc of this.documents.values()) {
      // Count by type
      byType[doc.metadata.type] = (byType[doc.metadata.type] || 0) + 1;

      // Count by subject
      if (doc.metadata.subject) {
        bySubject[doc.metadata.subject] =
          (bySubject[doc.metadata.subject] || 0) + 1;
      }

      // Estimate size (text + vector)
      totalSize += doc.text.length + doc.vector.length * 4;
    }

    return {
      totalDocuments: this.documents.size,
      byType: byType as Record<MemoryType, number>,
      bySubject,
      totalSize,
    };
  }

  // =========================
  // PERSISTENCE
  // =========================

  private async loadFromIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: "id" });
        }
      };

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(this.storeName, "readonly");
        const store = transaction.objectStore(this.storeName);
        const getAllRequest = store.getAll();

        getAllRequest.onsuccess = () => {
          const docs = getAllRequest.result as VectorDocument[];
          for (const doc of docs) {
            this.documents.set(doc.id, doc);
          }
          db.close();
          resolve();
        };

        getAllRequest.onerror = () => {
          db.close();
          reject(getAllRequest.error);
        };
      };
    });
  }

  private async saveToIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(this.storeName, "readwrite");
        const store = transaction.objectStore(this.storeName);

        // Clear and add all
        const clearRequest = store.clear();
        clearRequest.onsuccess = () => {
          for (const doc of this.documents.values()) {
            store.add(doc);
          }
        };

        transaction.oncomplete = () => {
          db.close();
          resolve();
        };

        transaction.onerror = () => {
          db.close();
          reject(transaction.error);
        };
      };
    });
  }

  /**
   * Export all documents for backup
   */
  async export(): Promise<VectorDocument[]> {
    await this.ensureInitialized();
    return Array.from(this.documents.values());
  }

  /**
   * Import documents from backup
   */
  async import(documents: VectorDocument[]): Promise<void> {
    await this.ensureInitialized();

    for (const doc of documents) {
      this.documents.set(doc.id, doc);
    }

    await this.saveToIndexedDB();
  }

  /**
   * Clear all documents
   */
  async clear(): Promise<void> {
    this.documents.clear();
    await this.saveToIndexedDB();
  }

  // =========================
  // HELPERS
  // =========================

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  private generateId(): string {
    return `mem-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      console.warn("[MemoryStore] Vector dimension mismatch");
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i]! * b[i]!;
      normA += a[i]! * a[i]!;
      normB += b[i]! * b[i]!;
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  private matchesFilter(
    doc: VectorDocument,
    filter: { type?: MemoryType; sourceId?: string; subject?: string },
  ): boolean {
    if (filter.type && doc.metadata.type !== filter.type) return false;
    if (filter.sourceId && doc.metadata.sourceId !== filter.sourceId)
      return false;
    if (filter.subject && doc.metadata.subject !== filter.subject) return false;
    return true;
  }

  private matchesSearchOptions(
    doc: VectorDocument,
    options?: SearchOptions,
  ): boolean {
    if (!options) return true;

    // Filter by types
    if (options.types && !options.types.includes(doc.metadata.type)) {
      return false;
    }

    // Filter by minimum trust score
    if (options.minTrust && doc.metadata.trustScore < options.minTrust) {
      return false;
    }

    // Filter by subject
    if (options.subject && doc.metadata.subject !== options.subject) {
      return false;
    }

    return true;
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let memoryStoreInstance: MemoryStore | null = null;

export function getMemoryStore(): MemoryStore {
  if (!memoryStoreInstance) {
    memoryStoreInstance = new MemoryStore();
  }
  return memoryStoreInstance;
}

/**
 * Initialize memory store (call at app startup)
 */
export async function initializeMemoryStore(): Promise<void> {
  await getMemoryStore().initialize();
}

/**
 * Quick search function
 */
export async function searchMemory(
  query: string,
  options?: SearchOptions,
): Promise<SearchResult[]> {
  return getMemoryStore().search(query, options);
}

/**
 * Add to memory
 */
export async function addToMemory(
  text: string,
  type: MemoryType,
  metadata: {
    sourceId: string;
    sourceType: string;
    subject?: string;
    topic?: string;
    validated?: boolean;
  },
): Promise<string> {
  return getMemoryStore().add(text, {
    type,
    trustScore: TRUST_SCORES[type as keyof typeof TRUST_SCORES] || 0.5,
    ...metadata,
    validated: metadata.validated ?? false,
  });
}
