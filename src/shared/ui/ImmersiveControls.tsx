import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import React, { useState } from "react";

interface ImmersiveControlsProps {
    controls: React.ReactNode;
    instructions?: React.ReactNode;
    activeModuleLabel?: string;
    defaultInstructionsOpen?: boolean;
    accentColor?: "emerald" | "cyan" | "rose" | "violet" | "amber" | "fuchsia" | "sky" | "blue" | "lime" | "pink" | "red" | "indigo" | "slate";
}

const colorMap = {
    emerald: "text-emerald-500/80 bg-emerald-500/50",
    cyan: "text-cyan-500/80 bg-cyan-500/50",
    rose: "text-rose-500/80 bg-rose-500/50",
    violet: "text-violet-500/80 bg-violet-500/50",
    amber: "text-amber-500/80 bg-amber-500/50",
    fuchsia: "text-fuchsia-500/80 bg-fuchsia-500/50",
    sky: "text-sky-500/80 bg-sky-500/50",
    blue: "text-blue-500/80 bg-blue-500/50",
    lime: "text-lime-500/80 bg-lime-500/50",
    pink: "text-pink-500/80 bg-pink-500/50",
    red: "text-red-500/80 bg-red-500/50",
    indigo: "text-indigo-500/80 bg-indigo-500/50",
    slate: "text-slate-500/80 bg-slate-500/50",
};

export const ImmersiveControls: React.FC<ImmersiveControlsProps> = ({
    controls,
    instructions,
    activeModuleLabel,
    defaultInstructionsOpen = false,
    accentColor = "emerald",
}) => {
    const [isInstructionsOpen, setInstructionsOpen] = useState(
        defaultInstructionsOpen,
    );

    const colors = colorMap[accentColor] || colorMap.emerald;
    const [textColor, bgColor] = colors.split(" ");

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
                        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 ${bgColor} blur-xl`} />
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex flex-col gap-1">
                                <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${textColor}`}>
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
                {/* Main Controls Area - Always Visible */}
                <motion.div layout className="overflow-visible flex items-end">
                    {/* Inner horizontal container: No Wrap, Bottom Aligned */}
                    <div className="flex flex-row flex-nowrap items-end justify-center gap-2 px-1">
                        {controls}
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};
