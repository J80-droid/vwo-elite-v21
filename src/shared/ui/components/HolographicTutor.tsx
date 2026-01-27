import { AnimatePresence,motion } from "framer-motion";
import { BrainCircuit, Eye, Mic } from "lucide-react";
import React from "react";

interface HolographicTutorProps {
    status?: "idle" | "listening" | "thinking" | "speaking";
    message?: string;
}

export const HolographicTutor: React.FC<HolographicTutorProps> = ({
    status = "idle",
    message = "Ik help je graag bij je VWO opdrachten.",
}) => {
    return (
        <div className="relative p-8 rounded-3xl bg-obsidian-900/40 border border-white/5 backdrop-blur-3xl overflow-hidden group">
            {/* Holographic Scanlines */}
            <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_2px,3px_100%] animate-pulse" />

            {/* Glowing Accents */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-500/10 blur-[80px] rounded-full" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-cyan-500/10 blur-[80px] rounded-full" />

            <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                {/* Avatar Visualizer */}
                <div className="relative">
                    <motion.div
                        className="w-24 h-24 rounded-full border-2 border-white/10 flex items-center justify-center bg-black/40 relative z-20"
                        animate={{
                            boxShadow: status === "thinking" ? "0 0 30px rgba(168,85,247,0.4)" : "0 0 20px rgba(0,240,255,0.1)",
                            scale: status === "listening" ? [1, 1.05, 1] : 1
                        }}
                        transition={{ repeat: Infinity, duration: 2 }}
                    >
                        <BrainCircuit size={40} className={`transition-colors duration-500 ${status === "thinking" ? "text-purple-400" : "text-cyan-400"}`} />
                    </motion.div>

                    {/* Radial Pulse */}
                    <AnimatePresence>
                        {status !== "idle" && (
                            <motion.div
                                initial={{ scale: 1, opacity: 0 }}
                                animate={{ scale: 1.5, opacity: 0.2 }}
                                exit={{ scale: 2, opacity: 0 }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className="absolute inset-0 rounded-full border border-cyan-500/50 z-10"
                            />
                        )}
                    </AnimatePresence>
                </div>

                <div className="space-y-2">
                    <h4 className="text-sm font-black text-electric uppercase tracking-tighter">Holographic Tutor</h4>
                    <p className="text-lg text-white font-medium max-w-sm leading-snug">
                        "{message}"
                    </p>
                </div>

                <div className="flex gap-4">
                    <button className="p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
                        <Mic size={18} className="text-slate-400 group-hover:text-cyan-400" />
                    </button>
                    <button className="p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
                        <Eye size={18} className="text-slate-400 group-hover:text-purple-400" />
                    </button>
                </div>
            </div>

            {/* Bottom Status bar */}
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/5">
                <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 to-cyan-500"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                />
            </div>
        </div>
    );
};

