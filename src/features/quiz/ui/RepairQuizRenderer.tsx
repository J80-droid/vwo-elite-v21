/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestLabQuestion } from "@shared/types/index";
import { MarkdownRenderer } from "@shared/ui/MarkdownRenderer";
import { BrainCircuit, Lightbulb } from "lucide-react";
import React, { useEffect, useState } from "react";

import { QuizRenderer } from "./QuizRenderer";
import { WhyReviewInput } from "./WhyReviewInput";

interface RepairProps {
  question: TestLabQuestion;
  onAnswer: (isCorrect: boolean, answer: any) => void;
  hintContext: string;
}

export const RepairQuizRenderer: React.FC<RepairProps> = ({
  question,
  onAnswer,
  hintContext,
}) => {
  const [showHint, setShowHint] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);

  // New: Reflection State
  // If it's an "application" type question (Ordering, Error Spotting), we require reflection first.
  const requiresReflection = ["ordering", "error_spotting"].includes(
    question.type,
  );
  const [hasReflected, setHasReflected] = useState(!requiresReflection);

  // Reset state when question changes
  useEffect(() => {
    setHasReflected(!["ordering", "error_spotting"].includes(question.type));
    setShowHint(false);
    setHintLevel(0);
  }, [question.id, question.type]);

  const handleReflectionSubmit = (_reflection: string) => {
    // We could log this reflection, but for now just unlock the question
    setHasReflected(true);
  };

  // Slimme functie om de explanation op te knippen (Scaffolding)
  const getHintContent = () => {
    if (!hintContext)
      return "Geen hint beschikbaar. Probeer de vraag te analyseren.";

    // Simple progressive disclosure logic
    const parts = hintContext.split("\n\n");
    if (hintLevel === 0) return parts[0] || ""; // First paragraph
    return hintContext; // Full hint
  };

  return (
    <div className="relative">
      {/* Scaffolding Toolbar */}
      <div className="mb-6 flex justify-between items-center bg-gray-800/50 p-3 rounded-lg border border-gray-700">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <BrainCircuit className="w-4 h-4 text-emerald-500" />
          <span>Scaffolding Modus</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowHint(true);
              if (showHint) setHintLevel(1); // Increase level on second click
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 rounded-md transition-colors text-sm font-medium border border-amber-500/30"
          >
            <Lightbulb className="w-4 h-4" />
            {showHint
              ? hintLevel === 0
                ? "Meer Hulp"
                : "Toon Volledige Uitleg"
              : "Vraag Hint"}
          </button>
        </div>
      </div>

      {/* Hint Box */}
      {showHint && (
        <div
          className="mb-6 p-4 bg-amber-900/10 border-l-4 border-amber-500 rounded-r-lg animate-fade-in opacity-0 fill-mode-forwards"
          style={{ animationName: "fadeIn", animationDuration: "0.5s" }}
        >
          <p className="text-xs font-bold text-amber-500 mb-1 uppercase tracking-wider">
            AI Coach Tip {hintLevel + 1}/2
          </p>
          <div className="text-amber-100/90 text-sm leading-relaxed">
            <MarkdownRenderer content={getHintContent()} />
          </div>
        </div>
      )}

      {/* Why-Review Intervention */}
      {!hasReflected && <WhyReviewInput onSubmit={handleReflectionSubmit} />}

      {/* Original QuizRenderer - Only show if reflected */}
      {hasReflected && (
        <div className="animate-fade-in">
          <QuizRenderer
            question={question}
            onAnswer={(isCorrect, answer, _score, _maxScore) => {
              // We kunnen hier latere logica toevoegen om te tracken of hints gebruikt zijn
              onAnswer(isCorrect, answer);
            }}
          />
        </div>
      )}
    </div>
  );
};
