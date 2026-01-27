import { useCallback, useEffect, useState } from "react";

/**
 * Context Manager Hook
 * Manages multiple context sources for AI conversations
 */

export interface ContextItem {
  id: string;
  type:
    | "text"
    | "clipboard"
    | "url"
    | "image"
    | "file"
    | "pdf"
    | "youtube"
    | "wikipedia";
  title: string;
  content: string;
  preview?: string; // Short preview for UI
  imageBase64?: string; // For image context
  timestamp: number;
}

interface UseContextManagerReturn {
  contexts: ContextItem[];
  addContext: (
    type: ContextItem["type"],
    title: string,
    content: string,
    imageBase64?: string,
  ) => void;
  removeContext: (id: string) => void;
  clearContexts: () => void;
  buildContextString: () => string;
  hasContexts: boolean;
  totalContextLength: number;
  shouldPersist: boolean;
  togglePersist: () => void;
}

const STORAGE_KEY = "vwo-elite-contexts";
const PREF_KEY = "vwo-elite-context-persist-pref";

export const useContextManager = (): UseContextManagerReturn => {
  // Initialize preferences from storage
  const [shouldPersist, setShouldPersist] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(PREF_KEY) === "true";
  });

  // Initialize contexts from storage if persistence is on
  const [contexts, setContexts] = useState<ContextItem[]>(() => {
    if (typeof window === "undefined") return [];
    if (localStorage.getItem(PREF_KEY) === "true") {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });

  // Save preference when changed
  const togglePersist = useCallback(() => {
    setShouldPersist((prev) => {
      const newState = !prev;
      localStorage.setItem(PREF_KEY, String(newState));

      if (newState) {
        // Determine what to save: current state
        localStorage.setItem(STORAGE_KEY, JSON.stringify(contexts));
      } else {
        // Clear storage but keep memory
        localStorage.removeItem(STORAGE_KEY);
      }
      return newState;
    });
  }, [contexts]);

  // Effect to save contexts when they change (only if persistence is on)
  useEffect(() => {
    if (shouldPersist) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(contexts));
    }
  }, [contexts, shouldPersist]);

  const generateId = () =>
    `ctx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const addContext = useCallback(
    (
      type: ContextItem["type"],
      title: string,
      content: string,
      imageBase64?: string,
    ) => {
      const newContext: ContextItem = {
        id: generateId(),
        type,
        title,
        content,
        preview:
          content.length > 100 ? content.substring(0, 100) + "..." : content,
        ...(imageBase64 ? { imageBase64 } : {}),
        timestamp: Date.now(),
      };

      setContexts((prev) => [...prev, newContext]);
    },
    [],
  );

  const removeContext = useCallback((id: string) => {
    setContexts((prev) => prev.filter((ctx) => ctx.id !== id));
  }, []);

  const clearContexts = useCallback(() => {
    setContexts([]);
  }, []);

  const buildContextString = useCallback((): string => {
    if (contexts.length === 0) return "";

    const contextSections = contexts.map((ctx, index) => {
      const header = `### Context ${index + 1}: ${ctx.title} (${ctx.type.toUpperCase()})`;
      return `${header}\n${ctx.content}`;
    });

    return `---\n## BIJGEVOEGDE CONTEXT\nDe gebruiker heeft de volgende context toegevoegd aan dit gesprek:\n\n${contextSections.join("\n\n---\n\n")}\n---`;
  }, [contexts]);

  return {
    contexts,
    addContext,
    removeContext,
    clearContexts,
    buildContextString,
    hasContexts: contexts.length > 0,
    totalContextLength: contexts.reduce(
      (acc, ctx) => acc + ctx.content.length,
      0,
    ),
    shouldPersist,
    togglePersist,
  };
};
