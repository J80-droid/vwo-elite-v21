import { motion } from "framer-motion";
import { Cpu, Globe, LucideIcon, Shield, Wifi, Zap } from "lucide-react";
import React, { useEffect, useState } from "react";

const BOOT_SEQUENCE = [
  { text: "Initializing VWO_ELITE KERNEL...", delay: 100 },
  { text: "Loading Neural Interface...", delay: 600 },
  { text: "Verifying Identity Matrix...", delay: 1000 },
  { text: "Mounting Knowledge Base (RAG)...", delay: 1500 },
  { text: "Connecting to Gemini 1.5 Pro...", delay: 2000 },
  { text: "Synchronizing Quantum States...", delay: 2400 },
  { text: "Optimizing 3D Render Engine...", delay: 2800 },
  { text: "Establishing Secure Uplink...", delay: 3200 },
  { text: "SYSTEM READY", delay: 3500 },
];

export const SystemLoader: React.FC<{ message?: string }> = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let currentIndex = 0;
    const timeouts: NodeJS.Timeout[] = [];

    const runSequence = () => {
      if (currentIndex >= BOOT_SEQUENCE.length) {
        setTimeout(() => setIsComplete(true), 500);
        return;
      }

      const item = BOOT_SEQUENCE[currentIndex];
      if (!item) return;

      setLogs((prev) => [...prev.slice(-5), item.text]);
      setProgress(((currentIndex + 1) / BOOT_SEQUENCE.length) * 100);

      const nextItem = BOOT_SEQUENCE[currentIndex + 1];
      const nextDelay =
        currentIndex < BOOT_SEQUENCE.length - 1 && nextItem
          ? nextItem.delay - item.delay
          : 500;

      currentIndex++;
      timeouts.push(setTimeout(runSequence, nextDelay));
    };

    timeouts.push(setTimeout(runSequence, 100));

    return () => timeouts.forEach(clearTimeout);
  }, []);

  return (
    <div className="fixed inset-0 bg-obsidian-950 flex flex-col items-center justify-center overflow-hidden z-[10000]">
      {/* Background Grid Effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center max-w-md w-full px-6">
        {/* Core Profile Ring */}
        <div className="relative mb-12">
          {/* Pulsing Rings */}
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full bg-emerald-500/20 blur-xl"
          />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-2 rounded-full border border-emerald-500/30 border-t-emerald-400 border-r-transparent"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-6 rounded-full border border-electric/20 border-b-electric border-l-transparent"
          />

          {/* Profile Image */}
          <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.3)] bg-black">
            <img
              src="Profile2.png"
              alt="System Core"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1 bg-gray-900 rounded-full mb-8 overflow-hidden relative">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-600 to-emerald-400"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 50 }}
          />
          {/* Glitch Shine */}
          <motion.div
            className="absolute inset-y-0 width-10 bg-white/50 blur-md"
            animate={{ left: ["-10%", "110%"] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
          />
        </div>

        <div className="w-full bg-black/80 border border-emerald-500/20 rounded-xl p-5 font-mono text-sm min-h-[180px] backdrop-blur-md relative overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.1)]">
          <div className="flex items-center justify-between mb-4 border-b border-emerald-500/10 pb-2">
            <span className="text-[10px] uppercase font-black text-emerald-500/50 tracking-widest">System Kernel Logs</span>
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500/30" />
              <div className="w-2 h-2 rounded-full bg-amber-500/30" />
              <div className="w-2 h-2 rounded-full bg-emerald-500/30" />
            </div>
          </div>

          <div className="space-y-2">
            {logs.map((log, i) => (
              <div
                key={`${log}-${i}`}
                className="flex items-start gap-3 text-[13px] leading-relaxed text-slate-200 last:text-emerald-400 last:font-bold last:drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]"
              >
                <span className="text-emerald-500 mt-1">{">"}</span>
                <span>
                  {log}
                  {i === logs.length - 1 && !isComplete && (
                    <span className="animate-pulse ml-1">_</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* System Icons Status */}
        <div className="flex justify-center gap-6 mt-8 text-emerald-500/40">
          <StatusIcon icon={Cpu} active={progress > 10} />
          <StatusIcon icon={Wifi} active={progress > 40} />
          <StatusIcon icon={Shield} active={progress > 70} />
          <StatusIcon icon={Globe} active={progress > 85} />
          <StatusIcon icon={Zap} active={progress > 95} />
        </div>
      </div>
    </div>
  );
};

const StatusIcon = ({
  icon: Icon,
  active,
}: {
  icon: LucideIcon;
  active: boolean;
}) => (
  <motion.div
    animate={{
      color: active ? "#10b981" : "#064e3b",
      scale: active ? 1.1 : 1,
      textShadow: active ? "0 0 10px rgba(16,185,129,0.5)" : "none",
    }}
    className="transition-colors duration-500"
  >
    <Icon size={20} />
  </motion.div>
);
