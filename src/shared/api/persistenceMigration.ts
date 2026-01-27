/* eslint-disable unused-imports/no-unused-vars */
import * as idb from "./indexedDBService";
import {
  persistDatabase,
  saveFlashcardSQL,
  savePWSProjectSQL,
  saveStudyMaterialSQL,
  sqliteInsert,
} from "./sqliteService";

const MIGRATION_FLAG_KEY = "vwo_elite_migration_v2_complete";

/**
 * Migration Service: Consolidates data from legacy IndexedDB to unified SQLite.
 */
export async function runPersistenceMigration(): Promise<void> {
  // Check if migration already completed
  const isComplete = localStorage.getItem(MIGRATION_FLAG_KEY);
  if (isComplete === "true") {
    // console.log('[Migration] Persistence migration already complete.');
    return;
  }

  // console.log('[Migration] Starting data consolidation to SQLite...');

  try {
    // 1. Migrate Study Materials
    const materials = await idb.getAllMaterials();
    if (materials.length > 0) {
      console.log(
        `[Migration] Migrating ${materials.length} study materials...`,
      );
      for (const m of materials) {
        await saveStudyMaterialSQL(m);
      }
    }

    // 2. Migrate Flashcards
    const flashcards = await idb.getAllFlashcards();
    if (flashcards.length > 0) {
      console.log(`[Migration] Migrating ${flashcards.length} flashcards...`);
      for (const f of flashcards) {
        await saveFlashcardSQL(f);
      }
    }

    // 3. Migrate PWS Projects
    const projects = await idb.getAllPWSProjects();
    if (projects.length > 0) {
      console.log(`[Migration] Migrating ${projects.length} PWS projects...`);
      for (const p of projects) {
        await savePWSProjectSQL(p);
      }
    }

    // 4. Migrate Generated Media (Hybrid: Metadata to SQL, Keep Blob in IDB)
    const media = await idb.getGeneratedMedia();
    if (media.length > 0) {
      console.log(
        `[Migration] Migrating ${media.length} generated media metadata to SQLite...`,
      );
      for (const item of media) {
        // Manually insert metadata to SQL to avoid re-writing heavy blobs to IDB
        const { createdAt, data, ...rest } = item;
        const sqlData = {
          ...rest,
          data: "[BLOB_REF_IDB]", // Reference marker
          created_at: createdAt || Date.now(),
        };
        // Use internal insert directly (via exposed helper or just call the service)
        // Since we can't easily import 'sqliteInsert' if it's not exported (it IS exported), we use it.
        await sqliteInsert("generated_media", sqlData);
      }
    }

    // Ensure everything is saved to the SQLite blob storage
    await persistDatabase();

    // Mark as complete
    localStorage.setItem(MIGRATION_FLAG_KEY, "true");
    console.log("[Migration] Persistence migration successful.");
  } catch (error) {
    console.error("[Migration] CRITICAL: Persistence migration failed!", error);
    // We don't throw here to avoid blocking app start,
    // but the flag won't be set so it will retry.
  }
}
