import { SourceAnalysisQuestion as SourceQuestion } from "@shared/types/index";
import { MarkdownRenderer } from "@shared/ui/MarkdownRenderer";
import { FileSearch, FileText } from "lucide-react";
import React, { useState } from "react";

interface SourceAnalysisQuestionProps {
  question: SourceQuestion;
  onAnswer: (isCorrect: boolean, givenAnswer: number) => void;
}

export const SourceAnalysisQuestion: React.FC<SourceAnalysisQuestionProps> = ({
  question,
  onAnswer,
}) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (idx: number) => {
    if (isSubmitted) return;
    setSelectedIdx(idx);
    setIsSubmitted(true);

    const isCorrect = idx === question.correctIndex;
    onAnswer(isCorrect, idx);
  };

  const getButtonClass = (idx: number): string => {
    const base = "w-full p-4 rounded-lg border text-left transition-all";

    if (!isSubmitted) {
      return `${base} bg-gray-800 border-gray-600 hover:bg-gray-700 hover:border-gray-500`;
    }

    if (idx === question.correctIndex) {
      return `${base} bg-green-900/50 border-green-500 text-green-100`;
    }
    if (idx === selectedIdx) {
      return `${base} bg-red-900/50 border-red-500 text-red-100`;
    }
    return `${base} opacity-40 border-gray-700`;
  };

  const optionLetters = ["A", "B", "C", "D", "E", "F"];

  return (
    <div className="max-w-6xl mx-auto my-6 flex flex-col lg:flex-row gap-6">
      {/* LEFT COLUMN: THE SOURCE (Scrollable) */}
      <div className="flex-1 bg-gray-900/40 border-l-4 border-amber-600 rounded-r-2xl shadow-xl overflow-hidden flex flex-col max-h-[75vh] backdrop-blur-xl border border-white/5">
        {/* Source Header */}
        <div className="bg-white/5 p-4 border-b border-white/5 flex items-center gap-2">
          <FileText className="w-4 h-4 text-amber-500" />
          <span className="text-amber-500 font-bold text-[10px] uppercase tracking-widest">
            Bronmateriaal
          </span>
        </div>

        {/* Source Content */}
        <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
          <h2 className="text-2xl font-serif font-bold text-gray-100 mb-6 leading-tight">
            {question.sourceTitle || ""}
          </h2>
          <div className="prose prose-invert prose-lg text-gray-300 font-serif leading-relaxed">
            <MarkdownRenderer content={question.sourceText || ""} />
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: THE QUESTION */}
      <div className="flex-1 flex flex-col bg-gray-900/40 p-6 rounded-2xl border border-white/5 shadow-2xl backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
            <FileSearch
              size={20}
              className="text-amber-400 shadow-[0_0_8px_#f59e0b]"
            />
          </div>
          <div>
            <h3 className="text-white font-bold tracking-tight">Bronanalyse</h3>
            <p className="text-[10px] text-amber-400/60 uppercase font-black tracking-widest leading-none">
              Analyseer de bron
            </p>
          </div>
        </div>

        <div className="text-white text-lg font-medium mb-6">
          <MarkdownRenderer
            content={question.question || question.text || ""}
          />
        </div>

        {/* Options */}
        <div className="space-y-3">
          {question.options?.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleSubmit(idx)}
              disabled={isSubmitted}
              className={getButtonClass(idx)}
            >
              <div className="flex gap-3">
                <span className="font-bold opacity-50">
                  {optionLetters[idx]}.
                </span>
                <div className="flex-1">
                  <MarkdownRenderer content={option} />
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Feedback Section */}
        {isSubmitted && (
          <div className="mt-6 pt-4 border-t border-gray-700 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              {selectedIdx === question.correctIndex ? (
                <span className="text-green-400 font-bold">✅ Correct!</span>
              ) : (
                <span className="text-red-400 font-bold">❌ Helaas...</span>
              )}
            </div>
            <div className="text-sm text-gray-400">
              <MarkdownRenderer content={question.explanation || ""} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
