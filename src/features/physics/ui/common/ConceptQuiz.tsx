import { AnimatePresence, motion } from "framer-motion";
import { Brain, Check, X } from "lucide-react";
import React, { useState } from "react";

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface ConceptQuizProps {
  isOpen: boolean;
  question: QuizQuestion;
  onComplete: (success: boolean) => void;
}

export const ConceptQuiz: React.FC<ConceptQuizProps> = ({
  isOpen,
  question,
  onComplete,
}) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [status, setStatus] = useState<"idle" | "correct" | "wrong">("idle");

  const handleSelect = (idx: number) => {
    if (status !== "idle") return;
    setSelected(idx);

    if (idx === question.correctIndex) {
      setStatus("correct");
      // Delay closing to show success state
      setTimeout(() => onComplete(true), 1500);
    } else {
      setStatus("wrong");
    }
  };

  const handleRetry = () => {
    setSelected(null);
    setStatus("idle");
  };

  // If failed, we might want to block or just allow retry.
  // For "Misconceptie-Killer", forced retry is good.

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="w-full max-w-md bg-[#0d1117] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-amber-500/10 to-transparent border-b border-white/5">
              <div className="flex items-center gap-3 text-amber-400 mb-2">
                <Brain size={20} />
                <span className="text-xs font-bold uppercase tracking-widest">
                  Concept Check
                </span>
              </div>
              <h3 className="text-xl font-bold text-white leading-tight">
                {question.question}
              </h3>
            </div>

            {/* Options */}
            <div className="p-6 space-y-3">
              {question.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  disabled={status !== "idle"}
                  className={`w-full !p-4 !text-left !text-sm !font-medium btn-elite-neon ${
                    selected === i
                      ? status === "correct"
                        ? "btn-elite-neon-emerald active"
                        : "btn-elite-neon-rose active"
                      : "btn-elite-neon-slate"
                  }`}
                >
                  {opt}
                  {selected === i && status === "correct" && (
                    <Check
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400"
                      size={16}
                    />
                  )}
                  {selected === i && status === "wrong" && (
                    <X
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-red-400"
                      size={16}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Feedback */}
            {status === "wrong" && (
              <div className="p-4 mx-6 mb-6 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-sm">
                <p className="mb-2 font-bold">Niet helemaal...</p>
                <p>{question.explanation}</p>
                <button
                  onClick={handleRetry}
                  className="btn-elite-neon btn-elite-neon-rose active mt-3 !px-4 !py-2 !text-[10px]"
                >
                  Probeer opnieuw
                </button>
              </div>
            )}
            {status === "correct" && (
              <div className="p-4 mx-6 mb-6 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-sm">
                <p className="font-bold">Correct!</p>
                <p>{question.explanation}</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
