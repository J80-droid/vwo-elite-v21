/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestLabQuestion } from "@shared/types/index";
import React from "react";

import { ErrorSpottingQuestion } from "./ErrorSpottingQuestion";
import { FillBlankQuestion } from "./FillBlankQuestion";
import { MultipleChoiceQuestion } from "./MultipleChoiceQuestion";
import { OpenQuestion } from "./OpenQuestion";
import { OrderingQuestion } from "./OrderingQuestion";
import { SourceAnalysisQuestion } from "./SourceAnalysisQuestion";

interface QuizRendererProps {
  question: TestLabQuestion;
  onAnswer: (
    isCorrect: boolean,
    givenAnswer: any,
    score?: number,
    maxScore?: number,
  ) => void;
}

export const QuizRenderer: React.FC<QuizRendererProps> = ({
  question,
  onAnswer,
}) => {
  switch (question.type) {
    case "multiple_choice":
    case "multiple-choice":
      return <MultipleChoiceQuestion question={question} onAnswer={onAnswer} />;

    case "error_spotting":
    case "error-spotting":
      return <ErrorSpottingQuestion question={question} onAnswer={onAnswer} />;

    case "source_analysis":
    case "source-analysis":
      return <SourceAnalysisQuestion question={question} onAnswer={onAnswer} />;

    case "ordering":
      return <OrderingQuestion question={question} onAnswer={onAnswer} />;

    case "fill_blank":
    case "fill-blank":
      return <FillBlankQuestion question={question} onAnswer={onAnswer} />;

    case "open":
    case "open_question":
      return <OpenQuestion question={question} onAnswer={onAnswer} />;

    default:
      return (
        <div className="p-6 bg-gray-900 rounded-xl border border-red-500">
          <span className="text-red-400">Onbekend vraagtype</span>
        </div>
      );
  }
};
