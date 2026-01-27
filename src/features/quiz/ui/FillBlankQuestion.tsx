import type { Question as FillQuestion } from "@shared/types/index";
import { MarkdownRenderer } from "@shared/ui/MarkdownRenderer";
import { Type } from "lucide-react";
import React, { useState } from "react";

interface FillBlankQuestionProps {
  question: FillQuestion;
  onAnswer: (isCorrect: boolean, givenAnswers: Record<number, string>) => void;
}

export const FillBlankQuestion: React.FC<FillBlankQuestionProps> = ({
  question,
  onAnswer,
}) => {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (blankIndex: number, value: string) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({ ...prev, [blankIndex]: value }));
  };

  const handleSubmit = () => {
    setIsSubmitted(true);

    // Check all blanks
    const allCorrect = (question.blanks || []).every(
      (blank) => answers[blank.index] === blank.answer,
    );

    onAnswer(allCorrect, answers);
  };

  // Parse text and insert dropdowns
  const renderTextWithBlanks = () => {
    // Split by __N__ pattern
    const parts = (question.text || "").split(/(__\d+__)/g);

    return parts.map((part, idx) => {
      const match = part.match(/__(\d+)__/);
      if (match && match[1]) {
        const blankIndex = parseInt(match[1], 10);
        const blank = (question.blanks || []).find(
          (b) => b.index === blankIndex,
        );

        if (!blank) return <span key={idx}>{part}</span>;

        const selectedValue = answers[blankIndex];
        const isCorrect = selectedValue === blank.answer;

        let selectClass =
          "mx-1 px-3 py-1 rounded-lg bg-obsidian-950/50 border border-white/10 text-white focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all";

        if (isSubmitted) {
          selectClass = isCorrect
            ? "mx-1 px-3 py-1 rounded bg-green-900/50 border border-green-500 text-green-200"
            : "mx-1 px-3 py-1 rounded bg-red-900/50 border border-red-500 text-red-200";
        }

        return (
          <select
            key={idx}
            value={selectedValue || ""}
            onChange={(e) => handleChange(blankIndex, e.target.value)}
            disabled={isSubmitted}
            className={selectClass}
          >
            <option value="">---</option>
            {(blank.options || []).map((opt, i) => (
              <option key={i} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );
      }

      // Regular text - could contain markdown/latex
      return (
        <div key={idx} className="inline-block">
          <MarkdownRenderer content={part} />
        </div>
      );
    });
  };

  const allFilled = (question.blanks || []).every(
    (blank) => answers[blank.index],
  );

  return (
    <div className="bg-gray-900/40 p-6 rounded-2xl border border-white/5 shadow-2xl max-w-2xl mx-auto backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
          <Type size={20} className="text-cyan-400 shadow-[0_0_8px_#06b6d4]" />
        </div>
        <div>
          <h3 className="text-white font-bold tracking-tight">Invuloefening</h3>
          <p className="text-[10px] text-cyan-400/60 uppercase font-black tracking-widest leading-none">
            Vul de ontbrekende woorden in
          </p>
        </div>
      </div>

      {/* Text with Blanks */}
      <div className="text-lg text-gray-100 leading-relaxed mb-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        {renderTextWithBlanks()}
      </div>

      {/* Submit Button */}
      {!isSubmitted ? (
        <button
          onClick={handleSubmit}
          disabled={!allFilled}
          className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow-lg transition-all"
        >
          Controleer Antwoorden
        </button>
      ) : (
        /* Feedback */
        <div className="space-y-4">
          {/* Per-blank feedback */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(question.blanks || []).map((blank) => {
              const given = answers[blank.index];
              const isCorrect = given === blank.answer;

              return (
                <div
                  key={blank.index}
                  className={`p-3 rounded-lg border ${
                    isCorrect
                      ? "bg-green-900/20 border-green-500/50"
                      : "bg-red-900/20 border-red-500/50"
                  }`}
                >
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-mono text-gray-400">
                      #{blank.index}
                    </span>
                    {isCorrect ? (
                      <span className="text-green-400">✅ {blank.answer}</span>
                    ) : (
                      <span className="text-red-400">
                        ❌ Jouw: "{given}" → Correct: "{blank.answer}"
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Explanation */}
          <div className="p-4 rounded-lg border border-gray-600 bg-gray-800">
            <strong className="text-white block mb-2">Uitleg:</strong>
            <div className="text-gray-300 text-sm">
              <MarkdownRenderer content={question.explanation || ""} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
