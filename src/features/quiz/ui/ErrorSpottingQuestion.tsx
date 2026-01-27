import { ErrorSpottingQuestion as ErrorQuestion } from "@shared/types/index";
import { MarkdownRenderer } from "@shared/ui/MarkdownRenderer";
import { ShieldAlert } from "lucide-react";
import React, { useState } from "react";

interface ErrorSpottingQuestionProps {
  question: ErrorQuestion;
  onAnswer: (isCorrect: boolean, givenAnswer: number) => void;
}

export const ErrorSpottingQuestion: React.FC<ErrorSpottingQuestionProps> = ({
  question,
  onAnswer,
}) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSelect = (idx: number) => {
    if (isSubmitted) return;
    setSelectedIdx(idx);
  };

  const handleSubmit = () => {
    if (selectedIdx === null || isSubmitted) return;
    setIsSubmitted(true);

    const isCorrect = selectedIdx === question.correctIndex;
    onAnswer(isCorrect, selectedIdx);
  };

  const getButtonClass = (idx: number): string => {
    const base =
      "p-4 rounded-lg border-2 text-left transition-all duration-200";

    if (!isSubmitted) {
      if (selectedIdx === idx) {
        return `${base} border-blue-500 bg-blue-500/10 text-blue-200`;
      }
      return `${base} border-gray-600 bg-gray-800 hover:border-blue-400`;
    }

    // After submission
    if (idx === question.correctIndex) {
      return `${base} border-green-500 bg-green-500/20 text-green-200`;
    }
    if (idx === selectedIdx && idx !== question.correctIndex) {
      return `${base} border-red-500 bg-red-500/20 text-red-200`;
    }
    return `${base} opacity-50 border-gray-700`;
  };

  return (
    <div className="bg-gray-900/40 p-6 rounded-2xl border border-white/5 shadow-2xl max-w-2xl mx-auto backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]">
          <ShieldAlert
            size={20}
            className="text-rose-400 shadow-[0_0_8px_#f43f5e]"
          />
        </div>
        <div>
          <h3 className="text-white font-bold tracking-tight">Foutenjager</h3>
          <p className="text-[10px] text-rose-400/60 uppercase font-black tracking-widest leading-none">
            Vind de fout in de redenering
          </p>
        </div>
      </div>

      {/* Context & Steps */}
      <div className="bg-black/20 p-4 rounded-xl mb-6 border border-white/5">
        <div className="text-gray-300 mb-4 italic">
          <MarkdownRenderer content={question.context || ""} />
        </div>

        <div className="space-y-2">
          {question.steps?.map((step: { text: string }, idx: number) => (
            <div
              key={idx}
              className="flex gap-3 items-start p-2 rounded hover:bg-gray-800 transition-colors"
            >
              <span className="text-gray-500 font-mono text-sm mt-1 min-w-[60px]">
                STAP {idx + 1}
              </span>
              <div className="text-gray-100 flex-1">
                <MarkdownRenderer content={step.text} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Question */}
      <div className="text-xl font-bold text-white mb-4">
        <MarkdownRenderer content={question.question || question.text || ""} />
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        {question.options?.map((option, idx) => (
          <button
            key={idx}
            onClick={() => handleSelect(idx)}
            disabled={isSubmitted}
            className={getButtonClass(idx)}
          >
            <span className="font-bold mr-2">
              {String.fromCharCode(65 + idx)}:
            </span>
            {option}
          </button>
        ))}
      </div>

      {/* Submit Button */}
      {!isSubmitted ? (
        <button
          onClick={handleSubmit}
          disabled={selectedIdx === null}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow-lg transition-all"
        >
          Controleer Antwoord
        </button>
      ) : (
        /* Feedback Section */
        <div
          className={`p-4 rounded-lg border ${
            selectedIdx === question.correctIndex
              ? "bg-green-900/20 border-green-500/50"
              : "bg-red-900/20 border-red-500/50"
          }`}
        >
          <div className="flex items-center gap-2 mb-2 font-bold">
            {selectedIdx === question.correctIndex ? (
              <span className="text-green-400">✅ Correct!</span>
            ) : (
              <span className="text-red-400">❌ Helaas...</span>
            )}
          </div>
          <div className="text-gray-300 text-sm">
            <MarkdownRenderer content={question.explanation || ""} />
          </div>
        </div>
      )}
    </div>
  );
};
