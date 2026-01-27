import { gradeOpenAnswer } from "@shared/api/gradeAnswer";
import { useSettings } from "@shared/hooks/useSettings";
import { OpenQuestionItem } from "@shared/types/index";
import { MarkdownRenderer } from "@shared/ui/MarkdownRenderer";
import { ChevronDown, ChevronUp, Loader2, PenTool } from "lucide-react";
import React, { useState } from "react";

interface OpenQuestionProps {
  question: OpenQuestionItem;
  onAnswer: (
    isCorrect: boolean,
    givenAnswer: string,
    score?: number,
    maxScore?: number,
  ) => void;
}

interface GradingResult {
  score: number;
  maxScore: number;
  isCorrect: boolean;
  feedback: string;
  missedKeywords?: string[];
}

export const OpenQuestion: React.FC<OpenQuestionProps> = ({
  question,
  onAnswer,
}) => {
  const { settings } = useSettings();
  const [answerText, setAnswerText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gradingResult, setGradingResult] = useState<GradingResult | null>(
    null,
  );
  const [showModelAnswer, setShowModelAnswer] = useState(false);

  const handleSubmit = async () => {
    if (!answerText.trim() || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const result = await gradeOpenAnswer({
        question: question.question || question.text || "",
        studentAnswer: answerText,
        rubric: question.rubric || "",
        modelAnswer: question.modelAnswer || "",
        maxScore: question.maxScore || 10,
        aiConfig: settings.aiConfig,
      });

      setGradingResult(result);

      // Consider it correct if score >= 50%
      const max = question.maxScore || 10;
      const passed = result.score >= max / 2;
      onAnswer(passed, answerText, result.score, max);
    } catch (error) {
      console.error("Grading failed:", error);
      // Fallback: just mark as pending
      setGradingResult({
        score: 0,
        maxScore: question.maxScore || 10,
        isCorrect: false,
        feedback: "❌ Er ging iets mis bij het nakijken. Probeer het opnieuw.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-900/40 p-6 rounded-2xl border border-white/5 shadow-2xl max-w-2xl mx-auto backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 shadow-[0_0_15px_rgba(14,165,233,0.1)]">
          <PenTool
            size={20}
            className="text-sky-400 shadow-[0_0_8px_#0ea5e9]"
          />
        </div>
        <div>
          <h3 className="text-white font-bold tracking-tight">Open Vraag</h3>
          <p className="text-[10px] text-sky-400/60 uppercase font-black tracking-widest leading-none">
            Formuleer een eigen antwoord
          </p>
        </div>
        <span className="bg-white/5 text-gray-500 text-[10px] ml-auto px-2 py-1 rounded-md uppercase font-bold tracking-widest border border-white/5">
          Max {question.maxScore || 10} punten
        </span>
      </div>

      {/* Question */}
      <div className="text-xl font-bold text-white mb-4">
        <MarkdownRenderer content={question.question || question.text || ""} />
      </div>

      {question.contextReference && (
        <div className="mb-4">
          <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] rounded border border-blue-500/20 font-bold uppercase tracking-widest">
            Referentie: {question.contextReference}
          </span>
        </div>
      )}

      {/* Input Field */}
      <div className="relative mb-4">
        <textarea
          value={answerText}
          onChange={(e) => setAnswerText(e.target.value)}
          disabled={gradingResult !== null || isSubmitting}
          placeholder="Typ hier je antwoord..."
          className="w-full h-32 bg-gray-800 text-white p-4 rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none disabled:opacity-50"
        />

        {/* Character Count */}
        {!gradingResult && (
          <div className="flex justify-between items-center mt-2 px-1">
            {question.hint && (
              <details className="inline-block">
                <summary className="text-[10px] text-amber-400/80 cursor-pointer hover:text-amber-400 transition-colors font-bold flex items-center gap-1 list-none">
                  <span>💡 Bekijk Hint</span>
                </summary>
                <div className="mt-1 text-[10px] text-amber-100/60 p-2 bg-amber-500/5 border border-amber-500/10 rounded italic max-w-xs">
                  {question.hint}
                </div>
              </details>
            )}
            <div className="text-xs text-gray-500 ml-auto">
              {answerText.length} tekens
            </div>
          </div>
        )}
      </div>

      {/* Submit Button */}
      {!gradingResult && (
        <button
          onClick={handleSubmit}
          disabled={!answerText.trim() || isSubmitting}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all flex justify-center items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Nakijken met AI...
            </>
          ) : (
            "Lever Antwoord In"
          )}
        </button>
      )}

      {/* Result Section */}
      {gradingResult && (
        <div className="mt-6 animate-fade-in space-y-4">
          {/* Score Header */}
          <div
            className={`p-4 rounded-t-lg border-b-2 flex justify-between items-center ${gradingResult.score > 0
              ? "bg-green-900/20 border-green-500/50"
              : "bg-red-900/20 border-red-500/50"
              }`}
          >
            <span className="font-bold text-gray-200">Beoordeling</span>
            <span className="text-xl font-mono font-bold text-white">
              {gradingResult.score} / {gradingResult.maxScore} pts
            </span>
          </div>

          {/* Feedback Body */}
          <div className="bg-gray-800 p-5 rounded-b-lg border border-gray-700 border-t-0">
            <div className="text-gray-300 mb-4">
              <MarkdownRenderer content={gradingResult.feedback} />
            </div>

            {/* Missed Keywords */}
            {gradingResult.missedKeywords &&
              gradingResult.missedKeywords.length > 0 && (
                <div className="mb-4">
                  <span className="text-xs text-red-400 font-bold uppercase tracking-wider block mb-1">
                    Je miste deze termen:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {gradingResult.missedKeywords.map((kw, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-red-500/10 text-red-300 text-xs rounded border border-red-500/30"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            {/* Model Answer (Expandable) */}
            <div className="mt-4 pt-4 border-t border-gray-700 space-y-4">
              {/* Solution Steps (NIEUW) */}
              {question.solutionSteps && (
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-2 block">
                    ✅ Volledige Uitwerking
                  </span>
                  <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-400">
                    {question.solutionSteps.map((step: string, sIdx: number) => (
                      <li key={sIdx}>
                        <MarkdownRenderer content={step} />
                      </li>
                    ))}
                  </ol>
                  {question.final_answer_latex && (
                    <div className="mt-2 text-xs text-emerald-300 font-bold">
                      Antwoord: {question.final_answer_latex}
                    </div>
                  )}
                </div>
              )}

              <div>
                <button
                  onClick={() => setShowModelAnswer(!showModelAnswer)}
                  className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2 font-medium"
                >
                  {showModelAnswer ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                  Bekijk Modelantwoord
                </button>

                {showModelAnswer && (
                  <div className="mt-3 text-sm text-gray-300 bg-black/20 p-3 rounded italic border-l-2 border-blue-500">
                    <MarkdownRenderer content={question.modelAnswer || ""} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
