import { useSearchStore } from "@stores/search.store";
import { DocSearchResult } from "@vwo/shared-types";
import { useCallback, useState } from "react";

export interface UseKnowledgeBaseReturn {
  searchResults: DocSearchResult[];
  isSearching: boolean;
  searchError: string | null;
  search: (query: string) => Promise<void>;
  addDocument: (file: File) => Promise<void>;
  uploadProgress: number; // 0-100
  uploadStage: string; // 'parsing', 'vectorizing', etc.
  uploadTimeRemaining: number; // seconds
}

export function useKnowledgeBase(): UseKnowledgeBaseReturn {
  // Local state for progress (since it's transient per upload)
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState("");
  const [uploadTimeRemaining, setUploadTimeRemaining] = useState(0);

  const {
    searchResults,
    isSearching,
    searchError,
    search: storeSearch,
  } = useSearchStore();

  // The hook is now just a thin wrapper or "ViewModel"
  // It delegates all heavy lifting to the Smart Store.

  // We wrap storeSearch to handle UI specifics if needed, or just exposure.
  const search = useCallback(
    async (query: string) => {
      await storeSearch(query);
    },
    [storeSearch],
  );

  const addDocument = useCallback(async (file: File) => {
    if (!window.vwoApi) {
      console.error(
        "window.vwoApi is undefined. Preload script might have failed to load or you are running in a browser.",
      );
      return;
    } else {
      console.log(
        "[useKnowledgeBase] vwoApi available keys:",
        Object.keys(window.vwoApi),
      );
    }

    // Electron specific: obtain path via webUtils (exposed in preload)
    let filePath: string | undefined;
    try {
      filePath = window.vwoApi.utils?.getPathForFile(file);
    } catch (e) {
      console.warn("getPathForFile failed, falling back to file.path", e);
      // @ts-expect-error: Legacy Access
      filePath = (file as Record<string, unknown>).path as string;
    }

    if (!filePath) {
      console.error(
        "File path not found. Ensure you are running in Electron and select a local file.",
      );
      return;
    }

    const meta = {
      id: crypto.randomUUID(),
      title: file.name,
      uploadDate: new Date().toISOString(),
      status: "indexing" as const, // Initial status
      path: filePath,
    };

    // Reset Progress
    setUploadProgress(0);
    setUploadStage("starting");
    setUploadTimeRemaining(0);

    // Setup Progress Listener
    // Note: Ideally we should unsubscribe, but for a single-file upload flow this is acceptable.
    // A better approach would be a dedicated useEffect with deps.

    const cleanup = window.vwoApi.on(
      "doc:progress",
      ((data: {
        fileId: string;
        stage: string;
        current: number;
        total: number;
        etr?: number;
      }) => {
        if (data.fileId === meta.id) {
          setUploadStage(data.stage);
          setUploadProgress(Math.round((data.current / data.total) * 100));
          setUploadTimeRemaining(data.etr || 0);
        }
      }) as unknown as (...args: unknown[]) => void,
    );

    try {
      // Send to Main process for Ingestion (Worker/Main)
      await window.vwoApi.documents.add(filePath, meta);
      console.log(`[Frontend] Upload requested for ${file.name}`);
    } catch (error) {
      console.error("Upload failed via IPC:", error);
      throw error; // Let component handle UI feedback
    } finally {
      // Cleanup listener after completion (or timeout)
      // We keep it briefly to show 100%
      cleanup();
    }
  }, []);

  return {
    searchResults,
    isSearching,
    searchError,
    search, // Exposes the store action
    addDocument,
    uploadProgress,
    uploadStage,
    uploadTimeRemaining,
  };
}
