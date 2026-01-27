import { useCallback, useState } from "react";

import { QuizQuestion } from "../types";

export const useQuizSession = () => {
  const [isActive, setIsActive] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Start een nieuwe sessie
  const startSession = useCallback((newQuestions: QuizQuestion[]) => {
    setQuestions(newQuestions);
    setCurrentIndex(0);
    setFeedback(null);
    setIsActive(true);
  }, []);

  // Sluit de sessie
  const endSession = useCallback(() => {
    setIsActive(false);
    setQuestions([]);
    setFeedback(null);
  }, []);

  // Verwerk antwoord
  const submitAnswer = useCallback(
    (answer: string) => {
      if (!questions[currentIndex]) return;

      const currentQ = questions[currentIndex];
      const isCorrect = answer === currentQ.correctAnswer;

      // Simpele feedback logica (kan uitgebreid worden)
      setFeedback(
        isCorrect
          ? "Correct! " + (currentQ.explanation || "")
          : "Helaas, dat is niet juist. " + (currentQ.explanation || ""),
      );
    },
    [questions, currentIndex],
  );

  // Navigatie
  const nextQuestion = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setFeedback(null);
    }
  }, [currentIndex, questions.length]);

  const prevQuestion = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setFeedback(null);
    }
  }, [currentIndex]);

  return {
    quizState: {
      isActive,
      questions,
      currentIndex,
      currentQuestion: questions[currentIndex],
      feedback,
      progress: (currentIndex / questions.length) * 100,
    },
    quizActions: {
      startSession,
      endSession,
      submitAnswer,
      nextQuestion,
      prevQuestion,
    },
  };
};
