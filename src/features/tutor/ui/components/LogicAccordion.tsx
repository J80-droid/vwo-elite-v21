import { AnimatePresence, motion } from "framer-motion";
import { BrainCircuit, CheckCircle2, ChevronDown } from "lucide-react";
import React, { useState } from "react";

export interface ReasoningStep {
  id: string;
  label: string;
  status: "pending" | "active" | "completed";
  detail?: string;
  timestamp: number;
}

interface LogicAccordionProps {
  steps: ReasoningStep[];
  isThinking: boolean;
}

export const LogicAccordion: React.FC<LogicAccordionProps> = ({
  steps,
  isThinking,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (steps.length === 0 && !isThinking) return null;

  return (
    <div className="w-full max-w-sm rounded-xl overflow-hidden border border-emerald-500/10 bg-black/20 backdrop-blur-sm transition-all">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 text-xs font-medium text-emerald-400/80 hover:bg-emerald-500/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BrainCircuit
            size={14}
            className={isThinking ? "animate-pulse" : ""}
          />
          <span>ALGORITHM REASONING</span>
        </div>
        <ChevronDown
          size={14}
          className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-emerald-500/10"
          >
            <div className="p-3 space-y-3">
              {steps.map((step, idx) => (
                <div key={step.id} className="flex gap-3 relative">
                  {/* Vertical Line */}
                  {idx !== steps.length - 1 && (
                    <div className="absolute left-[7px] top-4 bottom-[-12px] w-[1px] bg-emerald-500/10" />
                  )}

                  {/* Status Icon */}
                  <div
                    className={`mt-0.5 relative z-10 rounded-full p-0.5 ${
                      step.status === "active"
                        ? "bg-emerald-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                        : step.status === "completed"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-white/5 text-white/20"
                    }`}
                  >
                    {step.status === "active" ? (
                      <div className="w-3 h-3 rounded-full animate-pulse" /> // Active dot
                    ) : step.status === "completed" ? (
                      <CheckCircle2 size={12} />
                    ) : (
                      <div className="w-3 h-3 rounded-full border border-current" /> // Empty circle
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-xs ${
                        step.status === "active"
                          ? "text-emerald-300 font-medium"
                          : step.status === "completed"
                            ? "text-emerald-400/60"
                            : "text-gray-500"
                      }`}
                    >
                      {step.label}
                    </p>
                    {step.detail && step.status !== "pending" && (
                      <p className="text-[10px] text-gray-500 mt-0.5 font-mono truncate">
                        {step.detail}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
