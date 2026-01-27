import { markFirstRunComplete } from "@shared/lib/firstRunDetection";
import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";

const BOOT_SEQUENCE = [
    { text: "Initializing VWO_ELITE KERNEL...", delay: 0 },
    { text: "Loading Neural Interface...", delay: 800 },
    { text: "Verifying Identity Matrix...", delay: 1800 },
    { text: "Mounting Knowledge Base (RAG)...", delay: 2800 },
    { text: "Connecting to Gemini 1.5 Pro...", delay: 3800 },
    { text: "Synchronizing Quantum States...", delay: 4800 },
    { text: "Optimizing 3D Render Engine...", delay: 5800 },
    { text: "Establishing Secure Uplink...", delay: 6800 },
    { text: "SYSTEM READY", delay: 7800 },
];

interface FirstRunBootProps {
    onComplete: () => void;
}

/**
 * Premium first-run boot animation shown after silent install
 * Features absolute fullscreen WebM video (flex coverage)
 */
export const FirstRunBoot: React.FC<FirstRunBootProps> = ({ onComplete }) => {
    const [currentLog, setCurrentLog] = useState("");
    const [previousLogs, setPreviousLogs] = useState<string[]>([]);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        let currentIndex = 0;
        const timeouts: NodeJS.Timeout[] = [];

        const runSequence = () => {
            if (currentIndex >= BOOT_SEQUENCE.length) {
                // Complete sequence
                setTimeout(() => {
                    markFirstRunComplete();
                    onComplete();
                }, 800);
                return;
            }

            const item = BOOT_SEQUENCE[currentIndex];
            if (!item) return;

            // Update current log and move previous to history
            setCurrentLog((prev) => {
                if (prev) {
                    setPreviousLogs((logs) => [...logs.slice(-2), prev]);
                }
                return item.text;
            });
            setProgress(((currentIndex + 1) / BOOT_SEQUENCE.length) * 100);

            const nextItem = BOOT_SEQUENCE[currentIndex + 1];
            const nextDelay =
                currentIndex < BOOT_SEQUENCE.length - 1 && nextItem
                    ? nextItem.delay - item.delay
                    : 500;

            currentIndex++;
            timeouts.push(setTimeout(runSequence, nextDelay));
        };

        timeouts.push(setTimeout(runSequence, 300));

        return () => timeouts.forEach(clearTimeout);
    }, [onComplete]);


    return (
        <div className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden z-[9999] w-screen h-screen">
            {/* Background Base */}
            <div className="absolute inset-0 w-full h-full bg-black" />

            {/* Subtle Vignette Overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.3)_60%,rgba(0,0,0,0.8)_100%)] pointer-events-none" />

            {/* Top-Right Status Overlay */}
            <div className="absolute top-12 right-12 text-right z-30 max-w-xs transition-opacity duration-500">
                <motion.div
                    key={currentLog}
                    initial={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ duration: 0.3 }}
                    className="font-mono text-base tracking-wider mb-3"
                >
                    <span className="text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.6)]">
                        {currentLog}
                        <motion.span
                            animate={{ opacity: [1, 0, 1] }}
                            transition={{ repeat: Infinity, duration: 0.8 }}
                            className="ml-1"
                        >
                            _
                        </motion.span>
                    </span>
                </motion.div>

                <div className="space-y-1">
                    {previousLogs.map((log, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0.4 }}
                            animate={{ opacity: 0.3 }}
                            transition={{ duration: 0.5 }}
                            className="font-mono text-[12px] text-slate-300 tracking-wide font-medium"
                        >
                            {log}
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-8 font-mono text-4xl font-bold text-white/90 tabular-nums tracking-tighter"
                >
                    {Math.round(progress)}
                    <span className="text-cyan-500 text-2xl ml-1">%</span>
                </motion.div>
            </div>

            {/* Bottom Full-Width Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-slate-900/80 overflow-hidden z-20">
                <motion.div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-600 via-cyan-400 to-cyan-300"
                    initial={{ width: "0%" }}
                    animate={{ width: `${progress}%` }}
                    transition={{ type: "spring", stiffness: 30, damping: 12 }}
                />
                <motion.div
                    className="absolute inset-y-0 left-0 bg-cyan-400/50 blur-md"
                    initial={{ width: "0%" }}
                    animate={{ width: `${progress}%` }}
                    transition={{ type: "spring", stiffness: 30, damping: 12 }}
                />
                <motion.div
                    className="absolute inset-y-0 w-48 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                    animate={{ left: ["-15%", "115%"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
            </div>

            {/* VWO Elite Branding */}
            <div className="absolute bottom-12 left-12 z-20">
                <div className="flex items-center gap-5">
                    <img
                        src="./android-chrome-512x512.png"
                        alt="VWO Elite"
                        className="w-12 h-12 opacity-80"
                    />
                    <div className="flex flex-col">
                        <div className="font-bold text-white/80 tracking-[0.4em] text-lg uppercase">
                            VWO <span className="text-cyan-400">Elite</span>
                        </div>
                        <div className="font-mono text-[10px] text-white/40 tracking-[0.3em] uppercase">
                            Neural Core Initializing
                        </div>
                    </div>
                </div>
            </div>

            <div className="absolute bottom-12 right-12 z-20">
                <div className="font-mono text-[11px] text-white/20 tracking-[0.2em] uppercase">
                    v1.0.0 • Project Cerebrum
                </div>
            </div>
        </div>
    );
};
