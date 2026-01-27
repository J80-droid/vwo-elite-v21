import { MultipleChoiceQuestion as MCQuestion } from "@shared/types/index";
import { MarkdownRenderer } from "@shared/ui/MarkdownRenderer";
import { ListChecks } from "lucide-react";
import React, { useState } from "react";

interface MultipleChoiceQuestionProps {
  question: MCQuestion;
  onAnswer: (isCorrect: boolean, givenAnswer: number) => void;
}

export const MultipleChoiceQuestion: React.FC<MultipleChoiceQuestionProps> = ({
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

    const correctIdx =
      question.correctIndex ?? question.correctAnswerIndex ?? 0;
    const isCorrect = selectedIdx === correctIdx;
    onAnswer(isCorrect, selectedIdx);
  };

  const getButtonClass = (idx: number): string => {
    const base =
      "p-4 rounded-lg border-2 text-left transition-all duration-200 w-full";

    if (!isSubmitted) {
      if (selectedIdx === idx) {
        return `${base} border-blue-500 bg-blue-500/10 text-blue-200`;
      }
      return `${base} border-gray-600 bg-gray-800 hover:border-blue-400 hover:bg-gray-700`;
    }

    // After submission
    const correctIdx =
      question.correctIndex ?? question.correctAnswerIndex ?? 0;
    if (idx === correctIdx) {
      return `${base} border-green-500 bg-green-500/20 text-green-200`;
    }
    if (idx === selectedIdx && idx !== correctIdx) {
      return `${base} border-red-500 bg-red-500/20 text-red-200`;
    }
    return `${base} opacity-50 border-gray-700 bg-gray-800`;
  };

  const optionLetters = ["A", "B", "C", "D", "E", "F"];

  return (
    <div className="bg-gray-900/40 p-6 rounded-2xl border border-white/5 shadow-2xl max-w-2xl mx-auto backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
          <ListChecks
            size={20}
            className="text-blue-400 shadow-[0_0_8px_#3b82f6]"
          />
        </div>
        <div>
          <h3 className="text-white font-bold tracking-tight">
            Multiple Choice
          </h3>
          <p className="text-[10px] text-blue-400/60 uppercase font-black tracking-widest leading-none">
            Kies het juiste antwoord
          </p>
        </div>
        {question.tags && question.tags.length > 0 && (
          <div className="flex gap-1 ml-auto">
            {question.tags.map((tag, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-white/5 text-gray-400 text-[10px] rounded uppercase font-bold tracking-tighter"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="text-xl font-bold text-white mb-6">
        <MarkdownRenderer content={question.question || question.text || ""} />
      </div>

      {/* Logic: Context & Hint */}
      {(question.contextReference || question.hint) && (
        <div className="flex flex-wrap gap-2 mb-6">
          {question.contextReference && (
            <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-[10px] rounded border border-blue-500/20 font-bold uppercase tracking-widest">
              Referentie: {question.contextReference}
            </span>
          )}
          {question.hint && (
            <details className="w-full">
              <summary className="text-xs text-amber-400/80 cursor-pointer hover:text-amber-400 transition-colors font-bold flex items-center gap-1 list-none">
                <span>💡 Bekijk Hint</span>
              </summary>
              <div className="mt-2 text-xs text-amber-100/60 p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg italic">
                {question.hint}
              </div>
            </details>
          )}
        </div>
      )}

      {/* Options */}
      <div className="space-y-3 mb-6">
        {(question.options || []).map((option, idx) => (
          <button
            key={idx}
            onClick={() => handleSelect(idx)}
            disabled={isSubmitted}
            className={getButtonClass(idx)}
          >
            <div className="flex gap-3 items-start">
              <span className="font-bold text-gray-400 min-w-[24px]">
                {optionLetters[idx] ?? String.fromCharCode(65 + idx)}:
              </span>
              <div className="flex-1">
                <MarkdownRenderer content={option} />
              </div>
            </div>
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
          className={`p-4 rounded-lg border ${selectedIdx ===
            (question.correctIndex ?? question.correctAnswerIndex ?? 0)
            ? "bg-green-900/20 border-green-500/50"
            : "bg-red-900/20 border-red-500/50"
            }`}
        >
          <div className="flex items-center gap-2 mb-2 font-bold text-lg">
            {selectedIdx === question.correctIndex ? (
              <span className="text-green-400">✅ Correct!</span>
            ) : (
              <span className="text-red-400">❌ Helaas...</span>
            )}
          </div>
          <div className="text-gray-300 text-sm">
            <MarkdownRenderer content={question.explanation || ""} />
          </div>

          {question.solutionSteps && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <span className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-2 block">
                ✅ Volledige Uitwerking
              </span>
              <ol className="list-decimal list-inside space-y-2 text-sm text-slate-300">
                {question.solutionSteps.map((step: string, sIdx: number) => (
                  <li key={sIdx}>
                    <MarkdownRenderer content={step} />
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
