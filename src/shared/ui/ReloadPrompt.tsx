import { AnimatePresence, motion } from "framer-motion";
import { RefreshCw, X } from "lucide-react";
import React from "react";

// Stub out virtual:pwa-register during build troubleshooting
export const ReloadPrompt: React.FC = () => {
  const offlineReady = false;
  const needRefresh = false;
  const setOfflineReady = (_val: boolean) => {};
  const setNeedRefresh = (_val: boolean) => {};
  const updateServiceWorker = (_val: boolean) => {};

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <AnimatePresence>
      {(offlineReady || needRefresh) && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 right-6 z-[200] bg-obsidian-900 border border-electric/30 p-4 rounded-xl shadow-2xl flex flex-col gap-3 max-w-xs"
        >
          <div className="flex justify-between items-start">
            <h4 className="font-bold text-white text-sm">
              {offlineReady
                ? "App is klaar voor offline gebruik!"
                : "Nieuwe update beschikbaar!"}
            </h4>
            <button onClick={close} className="text-slate-500 hover:text-white">
              <X size={14} />
            </button>
          </div>

          {needRefresh && (
            <button
              onClick={() => updateServiceWorker(true)}
              className="bg-electric hover:bg-white hover:text-electric text-obsidian-950 font-bold py-2 px-4 rounded-lg text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <RefreshCw size={12} /> Herladen & Updaten
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
