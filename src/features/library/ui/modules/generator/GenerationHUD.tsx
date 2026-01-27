import { AnimatePresence,motion } from "framer-motion";
import { Brain, CheckCircle2, Cpu,Database, FileText } from "lucide-react";
import React from "react";

export type GenerationStage = "idle" | "ingest" | "digest" | "cache" | "generating" | "complete";

interface GenerationHUDProps {
    isOpen: boolean;
    stage: GenerationStage;
    statusMessage: string;
    progress: number; // 0-100
}

export const GenerationHUD: React.FC<GenerationHUDProps> = ({
    isOpen,
    stage,
    statusMessage,
    progress,
}) => {
    if (!isOpen && stage === "idle") return null;

    const steps = [
        { id: "ingest", label: "Smart Ingestion", icon: FileText },
        { id: "digest", label: "Knowledge Map-Reduce", icon: Brain },
        { id: "cache", label: "Neural Caching", icon: Database },
        { id: "generating", label: "Constructing Lesson", icon: Cpu },
    ];

    return (
        <AnimatePresence>
            {(isOpen || stage !== "idle") && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        className="w-full max-w-lg bg-background-depth border border-primary/20 rounded-2xl p-8 shadow-2xl relative overflow-hidden"
                    >

                        {/* Ambient Glow */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-primary blur-[20px]" />

                        {/* Header */}
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-3">
                                <span className="animate-pulse w-2 h-2 rounded-full bg-primary" />
                                System Processing
                            </h3>
                            <span className="text-primary font-mono font-bold">{progress}%</span>
                        </div>

                        {/* Steps Visualization */}
                        <div className="space-y-6 mb-8 relative">
                            {/* Connecting Line */}
                            <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-white/5" />

                            {steps.map((step, idx) => {
                                const isActive = stage === step.id;
                                const isCompleted = steps.findIndex(s => s.id === stage) > idx || stage === "complete";
                                const isPending = !isActive && !isCompleted;

                                return (
                                    <div key={step.id} className={`relative flex items-center gap-4 transition-all duration-500 ${isPending ? "opacity-30" : "opacity-100"}`}>
                                        <div
                                            className={`
                        z-10 w-12 h-12 rounded-xl border flex items-center justify-center transition-all duration-300
                        ${isActive ? "bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(59,130,246,0.5)] scale-110" :
                                                    isCompleted ? "bg-emerald-500/10 border-emerald-500 text-emerald-500" :
                                                        "bg-white/5 border-white/10 text-slate-500"}
                      `}
                                        >
                                            {isCompleted ? <CheckCircle2 size={20} /> : isActive ? <step.icon size={20} className="animate-pulse" /> : <step.icon size={20} />}
                                        </div>

                                        <div>
                                            <div className={`text-sm font-bold uppercase tracking-wide mb-0.5 ${isActive ? "text-white" : "text-slate-500"}`}>
                                                {step.label}
                                            </div>
                                            {isActive && (
                                                <div className="text-xs text-primary font-mono animate-in fade-in slide-in-from-left-2">
                                                    {">"} {statusMessage}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Progress Bar */}
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary transition-all duration-500 ease-out shadow-[0_0_10px_currentColor]"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
