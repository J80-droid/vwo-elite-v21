import type { SolutionResult } from "@features/math/api/StepSolver";
import { useTranslations } from "@shared/hooks/useTranslations";
import { MathRenderer } from "@shared/ui/MathRenderer";
import { AnimatePresence, motion } from "framer-motion";
import { Lightbulb } from "lucide-react";
import React from "react";

interface SolutionStepsProps {
  solution: SolutionResult;
}

export const SolutionSteps: React.FC<SolutionStepsProps> = ({ solution }) => {
  const { t } = useTranslations();

  return (
    <div className="bg-black/50 border border-white/10 rounded-xl p-6 backdrop-blur-md animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div className="h-full overflow-y-auto space-y-6 scrollbar-hide">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
            {t("calculus.step_problem")}
          </h2>
          <div className="px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700 text-xs font-mono text-slate-300">
            {solution.type}
          </div>
        </div>

        {/* Problem Statement */}
        <div className="p-6 bg-black/40 border border-white/5 rounded-xl text-center">
          <MathRenderer text={solution.problem} />
        </div>

        {/* Teaching Steps with Morphing Animation */}
        <div className="space-y-4 ml-6 border-l border-slate-800 pl-6">
          <AnimatePresence mode="popLayout">
            {solution.steps.map((step, index) => (
              <motion.div
                key={step.id || index}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.1,
                  type: "spring",
                  stiffness: 100,
                }}
                layout
                className="relative group"
              >
                {/* Step Number */}
                <div className="absolute left-[-29px] top-6 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-500 z-10 group-hover:border-amber-500/50 group-hover:text-amber-400 transition-colors">
                  {index + 1}
                </div>

                <div className="bg-white/5 border border-white/5 rounded-xl p-5 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                      <Lightbulb size={14} />
                    </div>
                    <span className="text-sm font-bold text-slate-200">
                      {step.title}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                    {step.description}
                  </p>

                  {step.latex && (
                    <div className="bg-black/40 rounded-lg p-4 border border-black/20 overflow-x-auto">
                      <MathRenderer text={step.latex} />
                    </div>
                  )}

                  {step.rationale && (
                    <p className="text-[10px] text-slate-500 mt-3 italic border-l-2 border-slate-700 pl-3">
                      {step.rationale}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Final Answer */}
        <div
          className="bg-gradient-to-r from-emerald-500/10 to-transparent border-l-2 pl-4 py-3 rounded-r-lg"
          style={{
            borderLeftColor: solution.primaryColor || "#10b981",
          }}
        >
          <div
            className="text-[10px] uppercase tracking-widest font-bold mb-1"
            style={{ color: solution.primaryColor || "#10b981" }}
          >
            {t("calculus.step_final")}
          </div>
          <div
            className="text-lg font-mono font-bold"
            style={{ color: solution.primaryColor ? "white" : "#6ee7b7" }}
          >
            <MathRenderer text={solution.finalAnswer} />
          </div>
        </div>
      </div>
    </div>
  );
};
