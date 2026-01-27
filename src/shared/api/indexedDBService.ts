/* eslint-disable @typescript-eslint/no-explicit-any -- dynamic IndexedDB records and migration logic */
/**
 * IndexedDB Service for storing large study materials
 * localStorage has a ~5MB limit, IndexedDB can store hundreds of MB
 */

import { PWSProject, StudyMaterial } from "../types";

const DB_NAME = "vwo-elite-db";
const DB_VERSION = 5; // Incremented for File Deduplication
const STORE_NAME = "materials";
const PWS_STORE_NAME = "pws_projects";
const MEDIA_STORE_NAME = "generated_media";

let db: IDBDatabase | null = null;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("subject", "subject", { unique: false });
        store.createIndex("fileFingerprint", "fileFingerprint", { unique: false });
      } else {
        const store = (event.currentTarget as IDBOpenDBRequest).transaction?.objectStore(STORE_NAME);
        if (store && !store.indexNames.contains("fileFingerprint")) {
          store.createIndex("fileFingerprint", "fileFingerprint", { unique: false });
        }
      }

      if (!database.objectStoreNames.contains(PWS_STORE_NAME)) {
        const store = database.createObjectStore(PWS_STORE_NAME, {
          keyPath: "id",
        });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }

      if (!database.objectStoreNames.contains("flashcards")) {
        const store = database.createObjectStore("flashcards", {
          keyPath: "id",
        });
        store.createIndex("nextReview", "nextReview", { unique: false });
      }

      if (!database.objectStoreNames.contains(MEDIA_STORE_NAME)) {
        const store = database.createObjectStore(MEDIA_STORE_NAME, {
          keyPath: "id",
        });
        store.createIndex("type", "type", { unique: false }); // 'video' or 'image'
      }
    };
  });
};

export const saveMaterial = async (material: StudyMaterial): Promise<void> => {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(material);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

export const getMaterialsBySubject = async (
  subject: string,
): Promise<StudyMaterial[]> => {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index("subject");
    const request = index.getAll(subject);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};

export const deleteMaterial = async (id: string): Promise<void> => {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

export const getAllMaterials = async (): Promise<StudyMaterial[]> => {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};

export const getMaterialByFingerprint = async (
  fingerprint: string,
): Promise<StudyMaterial | undefined> => {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index("fileFingerprint");
    const request = index.get(fingerprint);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};

// PWS Project Functions

export const savePWSProject = async (project: PWSProject): Promise<void> => {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([PWS_STORE_NAME], "readwrite");
    const store = transaction.objectStore(PWS_STORE_NAME);
    const request = store.put(project);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

export const getAllPWSProjects = async (): Promise<PWSProject[]> => {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([PWS_STORE_NAME], "readonly");
    const store = transaction.objectStore(PWS_STORE_NAME);
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};

export const deletePWSProject = async (id: string): Promise<void> => {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([PWS_STORE_NAME], "readwrite");
    const store = transaction.objectStore(PWS_STORE_NAME);
    const request = store.delete(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

export const getPWSSources = async (
  sourceIds: string[],
): Promise<StudyMaterial[]> => {
  const database = await openDB();
  return new Promise((resolve) => {
    const transaction = database.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);

    const materials: StudyMaterial[] = [];
    let completed = 0;

    if (sourceIds.length === 0) {
      resolve([]);
      return;
    }

    sourceIds.forEach((id) => {
      const request = store.get(id);
      request.onsuccess = () => {
        if (request.result) {
          materials.push(request.result);
        }
        completed++;
        if (completed === sourceIds.length) {
          resolve(materials);
        }
      };
      request.onerror = () => {
        console.error(`Failed to load source ${id}`);
        completed++;
        if (completed === sourceIds.length) {
          resolve(materials);
        }
      };
    });
  });
};

// Migrate from old localStorage to IndexedDB
export const migrateFromLocalStorage = async (
  storageKey: string,
): Promise<void> => {
  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return;

    const materials: StudyMaterial[] = JSON.parse(stored);
    for (const material of materials) {
      await saveMaterial(material);
    }

    // Clear old localStorage after successful migration
    localStorage.removeItem(storageKey);
    console.log(
      `Migrated ${materials.length} materials from localStorage to IndexedDB`,
    );
  } catch (error) {
    console.warn("Migration from localStorage failed:", error);
  }
};
// Flashcard Functions

export const saveFlashcard = async (card: any): Promise<void> => {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["flashcards"], "readwrite");
    const store = transaction.objectStore("flashcards");
    const request = store.put(card);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

export const getDueFlashcards = async (): Promise<any[]> => {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["flashcards"], "readonly");
    const store = transaction.objectStore("flashcards");
    const request = store.getAll(); // Get all and filter in memory for simplicity (FSRS logic is complex for DB query)
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const now = Date.now();
      const allCards = request.result;
      const dueCards = allCards.filter((card: any) => card.due <= now);
      resolve(dueCards);
    };
  });
};

export const getAllFlashcards = async (): Promise<any[]> => {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["flashcards"], "readonly");
    const store = transaction.objectStore("flashcards");
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};

// Generated Media Functions

export interface GeneratedMedia {
  id: string;
  type: "video" | "image";
  prompt: string;
  data: string; // Base64 or Blob URL
  createdAt: number;
}

export const saveGeneratedMedia = async (
  media: GeneratedMedia,
): Promise<void> => {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["generated_media"], "readwrite");
    const store = transaction.objectStore("generated_media");
    const request = store.put(media);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

export const getGeneratedMedia = async (): Promise<GeneratedMedia[]> => {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["generated_media"], "readonly");
    const store = transaction.objectStore("generated_media");
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      // Sort by Date Descending
      const results = request.result as GeneratedMedia[];
      results.sort((a, b) => b.createdAt - a.createdAt);
      resolve(results);
    };
  });
};

export const deleteGeneratedMedia = async (id: string): Promise<void> => {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["generated_media"], "readwrite");
    const store = transaction.objectStore("generated_media");
    const request = store.delete(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

export const getGeneratedMediaById = async (
  id: string,
): Promise<GeneratedMedia | undefined> => {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["generated_media"], "readonly");
    const store = transaction.objectStore("generated_media");
    const request = store.get(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};
