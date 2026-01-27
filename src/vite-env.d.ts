/* eslint-disable @typescript-eslint/no-explicit-any */
/// <reference types="vite/client" />
declare module "sql.js";

interface ImportMetaEnv {
  readonly VITE_MODEL_FLASH: string;
  readonly VITE_MODEL_PRO: string;
  readonly VITE_MODEL_LIVE: string;
  readonly VITE_GROQ_API_KEY: string;
  readonly VITE_GEMINI_API_KEY: string;
  readonly VITE_HF_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/// <reference types="vite-plugin-pwa/client" />

// PWA Register React Hook
declare module "virtual:pwa-register/react" {
  import type { Dispatch, SetStateAction } from "react";

  export interface RegisterSWOptions {
    immediate?: boolean;
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
    onRegistered?: (
      registration: ServiceWorkerRegistration | undefined,
    ) => void;
    onRegisterError?: (error: any) => void;
  }

  export function useRegisterSW(options?: RegisterSWOptions): {
    needRefresh: [boolean, Dispatch<SetStateAction<boolean>>];
    offlineReady: [boolean, Dispatch<SetStateAction<boolean>>];
    updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
  };
}
