import {
  AIConfig,
  DocSearchResult,
  DocumentChunk,
  DocumentMeta,
} from "@vwo/shared-types";
import type Database from "better-sqlite3";

import { DatabaseFactory } from "../infrastructure/database/database.factory";
import { safeLog } from "../utils/safe-logger";

export class DocumentRepository {
  // ADDED: Robust Status-Based Transaction
  async addDocument(meta: DocumentMeta, chunks: DocumentChunk[]) {
    const sqlite = DatabaseFactory.getSQLite() as unknown as Database;
    const lance = await DatabaseFactory.getLanceDB();

    // Step 1: Enforce initial status 'indexing'
    const initialStatus = "indexing";

    const insertMeta = sqlite.prepare(`
            INSERT INTO documents_meta (id, title, upload_date, status, path)
            VALUES (@id, @title, @uploadDate, @status, @path)
        `);

    // Step 2: Execute SQLite insert (Start Transaction)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const insertTransaction = (sqlite as any).transaction(() => {
      insertMeta.run({
        id: meta.id,
        title: meta.title,
        uploadDate: meta.uploadDate,
        status: initialStatus,
        path: meta.path || null,
      });
    });

    try {
      insertTransaction(); // Commit 'indexing' state to SQLite

      if (chunks.length === 0) {
        // No chunks? Document is technically ready (or empty)
        this.updateStatus(meta.id, "ready");
        return;
      }

      // Step 3: Execute LanceDB insert (Async/Heavy)
      let table;
      try {
        table = await lance.openTable("vectors");
      } catch {
        // Determine schema on first run
        table = await lance.createTable("vectors", [
          {
            vector:
              chunks[0]!.vector ??
              new Array(AIConfig.embedding.dimensions).fill(0),
            id: chunks[0]!.id,
            text: chunks[0]!.text,
            doc_id: meta.id,
            pageNumber: chunks[0]!.pageNumber,
            chunkIndex: chunks[0]!.chunkIndex,
            totalChunks: chunks[0]!.totalChunks,
            // bbox omitted if optional/undefined
          },
        ]);
      }

      const vectorData = chunks.map((c) => ({
        vector: c.vector,
        id: c.id,
        text: c.text,
        doc_id: meta.id,
        pageNumber: c.pageNumber,
        chunkIndex: c.chunkIndex,
        totalChunks: c.totalChunks,
        bbox: c.bbox,
      }));

      await table.add(vectorData);

      // SECURITY CHECK: Does metadata still exist?
      // User might have deleted the document DURING indexing.
      const exists = sqlite
        .prepare("SELECT 1 FROM documents_meta WHERE id = ?")
        .get(meta.id);

      if (!exists) {
        safeLog.warn(
          `[Repo] Document ${meta.id} was deleted during indexing. Rolling back vectors...`,
        );
        // Rollback newly added vectors to prevent orphans
        await table.delete(`doc_id = '${meta.id}'`);
        return;
      }

      // Step 4: COMMIT - Update status to 'ready'
      this.updateStatus(meta.id, "ready");

      safeLog.log(
        `[Repo] Document ${meta.id} successfully processed and marked 'ready'.`,
      );
    } catch (error) {
      safeLog.error("[Repo] Save failed, starting cleanup...", error);

      // ROLLBACK: Remove 'indexing' metadata and any partial vectors
      await this.deleteDocument(meta.id);

      throw new Error(`Save failed: ${(error as Error).message}`);
    }
  }

  // Helper for status updates
  private updateStatus(id: string, status: string) {
    const sqlite = DatabaseFactory.getSQLite();
    sqlite
      .prepare("UPDATE documents_meta SET status = ? WHERE id = ?")
      .run(status, id);
  }

  // SEARCH: Implicitly filters for valid documents
  async search(
    queryVector: number[] | Float32Array | null,
    limit: number = 20,
  ): Promise<DocSearchResult[]> {
    const sqlite = DatabaseFactory.getSQLite();
    const lance = await DatabaseFactory.getLanceDB();

    // If no query vector provided, just return latest documents from metadata (Semantic Browse)
    if (!queryVector) {
      const metaList = sqlite
        .prepare(
          `
                SELECT id, title, upload_date as uploadDate, status, path 
                FROM documents_meta 
                WHERE status = 'ready'
                ORDER BY upload_date DESC
                LIMIT ?
            `,
        )
        .all(limit) as DocumentMeta[];

      // We can't easily get chunks for all documents efficiently without vector search
      // So for browse mode, we return a synthetic result representing the whole document
      return metaList.map((meta) => ({
        id: meta.id, // Use doc ID as chunk ID for list view
        documentId: meta.id,
        text: `Document: ${meta.title}`, // Placeholder text
        score: 1.0, // Browsing has "perfect" score
        metadata: meta,
        pageNumber: 1,
        chunkIndex: 0,
        totalChunks: 1,
        vector: [],
      }));
    }

    const table = await lance.openTable("vectors");

    // Fix: LanceDB's search returns a query builder. In recent versions, .execute() might return a stream/iterator.
    // .toArray() is safer for small result sets like this.
    const results = await table
      .search(queryVector as number[])
      .limit(limit)
      .toArray();

    if (results.length === 0) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const docIds = (results as any[]).map((r) => r.doc_id);
    if (docIds.length === 0) return [];

    const placeholders = docIds.map(() => "?").join(",");

    // FILTER: Fetch metadata, ignoring documents not 'ready'
    // Prevents showing partial upload results
    const metaList = sqlite
      .prepare(
        `
            SELECT id, title, upload_date as uploadDate, status, path 
            FROM documents_meta 
            WHERE id IN (${placeholders}) AND status = 'ready'
        `,
      )
      .all(...docIds) as DocumentMeta[];

    const metaMap = new Map(metaList.map((m) => [m.id, m]));

    // Hydrate results
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hydratedResults = (results as any[]).reduce((acc, r) => {
      const docId = r.doc_id as string;
      const meta = metaMap.get(docId);

      // Skip if meta not found (status != ready or deleted)
      if (meta) {
        acc.push({
          id: r.id as string,
          documentId: docId,
          text: r.text as string,
          // LanceDB returns L2 distance by default, convert to similarity-like score if needed
          // For now, raw distance is OK, but UI expects 0-1 similarity usually.
          // Assuming Cosine distance if configured, 1 - distance = similarity
          score: 1 - (r._distance || 0),
          metadata: meta,
          pageNumber: r.pageNumber as number,
          chunkIndex: r.chunkIndex as number,
          totalChunks: r.totalChunks as number,
          bbox: r.bbox as number[],
          vector: [],
        });
      }
      return acc;
    }, [] as DocSearchResult[]);

    return hydratedResults;
  }

  // DELETE: Deep Delete
  async deleteDocument(id: string): Promise<void> {
    safeLog.log(`[Repo] Deleting document: ${id}`);
    const sqlite = DatabaseFactory.getSQLite();
    const lance = await DatabaseFactory.getLanceDB();

    try {
      const table = await lance.openTable("vectors");
      await table.delete(`doc_id = '${id}'`);
    } catch {
      safeLog.warn(`[Repo] Vector cleanup skipped (table/vectors not found).`);
    }

    sqlite.prepare("DELETE FROM documents_meta WHERE id = ?").run(id);
  }

  // INTEGRITY: Optimized Startup Cleanup
  async verifyIntegrity(): Promise<void> {
    safeLog.log("[Repo] Verifying database integrity...");
    const sqlite = DatabaseFactory.getSQLite();

    // 1. Find 'Corrupt' uploads
    // If app crashed during 'indexing', they will never become ready.
    const stalledUploads = sqlite
      .prepare(
        `
            SELECT id, title FROM documents_meta WHERE status = 'indexing'
        `,
      )
      .all() as DocumentMeta[];

    if (stalledUploads.length === 0) {
      safeLog.log("[Integrity] Database is healthy (No stalled uploads).");
      return;
    }

    safeLog.warn(
      `[Integrity] Found ${stalledUploads.length} stalled uploads. Cleaning up...`,
    );

    // 2. Clean up
    for (const meta of stalledUploads) {
      safeLog.log(
        `[Integrity] Purging stalled document: ${meta.title} (${meta.id})`,
      );
      await this.deleteDocument(meta.id);
    }

    safeLog.log("[Integrity] Cleanup complete.");
  }
}
