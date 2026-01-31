/**
 * Snippet Store (The Recipe Book)
 * Persists successful Python scripts and AI solutions to SQLite.
 */

import { sqliteDelete, sqliteInsert, sqliteSelect } from "@shared/api/sqliteService";
import { createStore } from "@shared/lib/storeFactory";
import { toast } from "sonner";

export interface CodeSnippet {
    id: string;
    intent: string;
    description: string;
    code: string;
    success_count: number;
    tags: string; // JSON string or comma-separated
    created_at: number;
}

interface SnippetStore {
    snippets: CodeSnippet[];
    isLoading: boolean;
    fetchSnippets: () => Promise<void>;
    saveSnippet: (snippet: Omit<CodeSnippet, "id" | "success_count" | "created_at">) => Promise<void>;
    deleteSnippet: (id: string) => Promise<void>;
    findSnippetByIntent: (intent: string) => Promise<CodeSnippet | null>;
}

export const useSnippetStore = createStore<SnippetStore>((set, get) => ({
    snippets: [],
    isLoading: false,

    fetchSnippets: async () => {
        set({ isLoading: true });
        try {
            const rows = await sqliteSelect<CodeSnippet>("code_snippets");
            set({ snippets: rows, isLoading: false });
        } catch (error) {
            console.error("[SnippetStore] Fetch failed:", error);
            set({ isLoading: false });
        }
    },

    saveSnippet: async (data) => {
        const id = crypto.randomUUID();
        const snippet: CodeSnippet = {
            id,
            ...data,
            success_count: 1,
            created_at: Date.now()
        };

        try {
            await sqliteInsert("code_snippets", snippet);
            set({ snippets: [...get().snippets, snippet] });
            toast.success("Elite Recept opgeslagen in het geheugen.");
        } catch (error) {
            console.error("[SnippetStore] Save failed:", error);
            toast.error("Kon recept niet opslaan.");
        }
    },

    deleteSnippet: async (id) => {
        try {
            await sqliteDelete("code_snippets", "id = ?", [id]);
            set({ snippets: get().snippets.filter(s => s.id !== id) });
        } catch (error) {
            console.error("[SnippetStore] Delete failed:", error);
        }
    },

    findSnippetByIntent: async (intent) => {
        const lowerIntent = intent.toLowerCase();
        // Naive search for now, could be upgraded to Vector search via VectorService
        return get().snippets.find(s =>
            s.intent.toLowerCase().includes(lowerIntent) ||
            s.description.toLowerCase().includes(lowerIntent)
        ) || null;
    }
}), {
    name: "snippet-store",
    persist: false
});
