import { useAIStatusStore } from "@shared/model/aiStatusStore";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  Settings as SettingsIcon,
  X,
} from "lucide-react";
import React from "react";

interface AIStatusBannerProps {
  onNavigateToSettings: () => void;
}

export const AIStatusBanner: React.FC<AIStatusBannerProps> = ({
  onNavigateToSettings,
}) => {
  const { modelError, clearModelError } = useAIStatusStore();

  if (!modelError) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0, y: -20 }}
        animate={{ height: "auto", opacity: 1, y: 0 }}
        exit={{ height: 0, opacity: 0, y: -20 }}
        className="overflow-hidden mb-6"
      >
        <div className="glass-amber border border-amber-500/30 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl shadow-amber-900/10">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-amber-500/20 rounded-lg text-amber-500">
              <AlertCircle size={20} />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">
                AI Model Niet Beschikbaar
              </h4>
              <p className="text-amber-200/80 text-xs mt-0.5">
                <span className="font-mono text-[10px] bg-black/30 px-1 rounded mr-1">
                  {modelError.provider}/{modelError.model}
                </span>
                is niet geactiveerd op jouw API key. Refresh de modellen in
                Settings.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onNavigateToSettings}
              className="flex items-center gap-2 bg-amber-500 text-black px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-amber-400 transition-colors"
            >
              <SettingsIcon size={14} />
              Instellingen Openen
              <ArrowRight size={14} />
            </button>
            <button
              onClick={clearModelError}
              className="p-1.5 text-amber-500/50 hover:text-amber-400 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
