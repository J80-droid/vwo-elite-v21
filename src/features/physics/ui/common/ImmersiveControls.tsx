import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import React, { useState } from "react";

interface ImmersiveControlsProps {
  controls: React.ReactNode;
  instructions?: React.ReactNode;
  activeModuleLabel?: string;
  defaultInstructionsOpen?: boolean;
}

export const ImmersiveControls: React.FC<ImmersiveControlsProps> = ({
  controls,
  instructions,
  activeModuleLabel,
  defaultInstructionsOpen = false,
}) => {
  const [isInstructionsOpen, setInstructionsOpen] = useState(
    defaultInstructionsOpen,
  );

  // Don't render if no controls are passed (avoids empty black pill)
  if (!controls) return null;

  return (
    <div className="fixed inset-x-0 bottom-6 flex flex-col items-center gap-4 z-50 pointer-events-none safe-area-bottom">
      {/* 1. Instructions Popup */}
      <AnimatePresence>
        {isInstructionsOpen && instructions && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="pointer-events-auto w-full max-w-lg bg-obsidian-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-emerald-500/50 blur-xl" />
            <div className="flex justify-between items-start mb-6">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500/80">
                  Instructions
                </span>
                <h3 className="text-xl font-bold text-white">
                  {activeModuleLabel}
                </h3>
              </div>
              <button
                onClick={() => setInstructionsOpen(false)}
                className="p-2 rounded-full hover:bg-white/5 text-slate-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="text-sm text-slate-300 leading-relaxed font-medium">
              {instructions}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Floating Bottom Dock (Elite Single-Row) */}
      <motion.div
        layout
        className="pointer-events-auto flex items-end gap-3 bg-black/60 backdrop-blur-3xl border border-white/10 p-2 rounded-3xl shadow-2xl w-fit max-w-[98vw] origin-bottom transition-transform duration-300 scale-[0.8] sm:scale-90 lg:scale-100 select-none pb-safe overflow-hidden"
      >
        {/* Controls Toggle */}
        {/* Controls Toggle Removed */}

        {/* Main Controls Area - Always Visible */}
        <motion.div layout className="overflow-visible flex items-end">
          {/* Inner horizontal container: No Wrap, Bottom Aligned */}
          <div className="flex flex-row flex-nowrap items-end justify-center gap-2 px-1">
            {controls}
          </div>
        </motion.div>

        {/* Divider */}

        {/* Instructions Button */}
        {/* Help Button Removed */}
      </motion.div>
    </div>
  );
};
