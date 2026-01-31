import { bootstrapApp } from "@shared/api/bootstrap";
import { useAutoSync } from "@shared/hooks/useAutoSync";
import { useSettings } from "@shared/hooks/useSettings";
import { isFirstRun } from "@shared/lib/firstRunDetection";
import React, { ReactNode, useEffect, useState } from "react";

import { SystemLoader } from "../shared/ui/loading";
import { VaultUnlockModal } from "../shared/ui/VaultUnlockModal";

interface AppBootstrapProps {
  children: ReactNode;
}


/**
 * AppBootstrap Component
 *
 * Wraps the app and ensures initialization is complete before rendering.
 * In v7.0, the cinematic first-run is handled by the Main process splash.
 */
export const AppBootstrap: React.FC<AppBootstrapProps> = ({ children }) => {
  const { settings } = useSettings();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  // 💓 ELITE HEARTBEAT: Auto-Sync & Provider Health Monitoring
  useAutoSync(settings);

  const [error, setError] = useState<string | null>(null);
  const [isFirstVisit] = useState(isFirstRun());

  useEffect(() => {
    let mounted = true;

    // Background initialization starts IMMEDIATELY
    const initPromise = bootstrapApp();

    // Minimum delay for regular SystemLoader (avoid flickering)
    // On first run, we don't need a delay here because the Main splash is showing the video
    const minDelay = isFirstVisit ? 0 : 3500;

    Promise.all([
      initPromise,
      new Promise((resolve) => setTimeout(resolve, minDelay)),
    ]).then(([result]) => {
      if (!mounted) return;

      if (result.success) {
        setStatus("ready");

      } else {
        setStatus("error");
        setError(result.error || "Onbekende fout bij opstarten");
      }
    });

    // Global Audio Interaction Handler
    const handleInteraction = async () => {
      try {
        const win = window as unknown as Window & {
          AudioContext: typeof AudioContext;
          webkitAudioContext: typeof AudioContext;
          Tone: { start: () => Promise<void> };
        };
        const AudioContextClass = win.AudioContext || win.webkitAudioContext;
        if (AudioContextClass) {
          const tempCtx = new AudioContextClass();
          if (tempCtx.state === "suspended") await tempCtx.resume();
        }
        if (win.Tone) await win.Tone.start();
      } catch (err) {
        console.warn("Audio interaction handler failed:", err);
      } finally {
        window.removeEventListener("pointerdown", handleInteraction);
        window.removeEventListener("keydown", handleInteraction);
      }
    };

    window.addEventListener("pointerdown", handleInteraction);
    window.addEventListener("keydown", handleInteraction);

    return () => {
      mounted = false;
      window.removeEventListener("pointerdown", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
    };
  }, [isFirstVisit]);


  // RENDER LOGIC: ENSURE NO FLICKER
  if (status === "loading") {
    return <SystemLoader />;
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-obsidian-950 flex items-center justify-center p-8">
        <div className="bg-obsidian-900 border border-rose-500/30 rounded-xl p-8 max-w-md text-center text-white">
          <h2 className="text-xl font-bold mb-2">Opstartfout</h2>
          <p className="text-slate-400 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-electric rounded-lg">
            Opnieuw proberen
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      <VaultUnlockModal />
    </>
  );
};
