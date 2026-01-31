import { create } from "zustand";

import {
    initVault,
    isVaultInitialized,
    isVaultUnlocked,
    lockVault,
    unlockVault,
} from "../lib/keyResolver";

interface VaultState {
    isLocked: boolean;
    isInitialized: boolean;
    error: string | null;
    actions: {
        unlock: (password: string) => Promise<boolean>;
        initialize: (password: string) => Promise<void>;
        lock: () => void;
        checkStatus: () => void;
    };
}

export const useVaultStore = create<VaultState>((set, get) => ({
    isLocked: !isVaultUnlocked(),
    isInitialized: isVaultInitialized(),
    error: null,
    actions: {
        unlock: async (password: string) => {
            set({ error: null });
            try {
                const success = await unlockVault(password);
                if (success) {
                    set({ isLocked: false, error: null });
                    return true;
                } else {
                    set({ error: "Ongeldig wachtwoord." });
                    return false;
                }
            } catch (e: unknown) {
                const message = e instanceof Error ? e.message : "Fout bij ontgrendelen.";
                set({ error: message });
                return false;
            }
        },
        initialize: async (password: string) => {
            set({ error: null });
            try {
                await initVault(password);
                set({ isLocked: false, isInitialized: true });
            } catch (e: unknown) {
                const message = e instanceof Error ? e.message : "Fout bij initialiseren.";
                set({ error: message });
            }
        },
        lock: () => {
            lockVault();
            set({ isLocked: true });
        },
        checkStatus: () => {
            set({
                isLocked: !isVaultUnlocked(),
                isInitialized: isVaultInitialized()
            });
        }
    }
}));
