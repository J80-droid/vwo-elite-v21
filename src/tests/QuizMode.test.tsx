import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// import React from 'react';
import { QuizMode } from "../features/lesson/QuizMode";
import { Question } from "../types";

const mockQuestions: Question[] = [
  {
    id: "1",
    text: "What is 2+2?",
    question: "What is 2+2?",
    type: "multiple-choice" as const,
    subject: "math",
    difficulty: "easy" as const,
    options: ["3", "4", "5", "6"],
    correctAnswerIndex: 1,
    explanation: "Math.",
  },
  {
    id: "2",
    text: "Capital of France?",
    question: "Capital of France?",
    type: "multiple-choice" as const,
    subject: "geography",
    difficulty: "easy" as const,
    options: ["London", "Berlin", "Paris", "Madrid"],
    correctAnswerIndex: 2,
    explanation: "Geography.",
  },
];

const mockT = {
  lesson: { question: "Vraag", back_to_lesson: "Terug" },
  exam: { prev: "Vorige", next: "Volgende" },
};

describe("QuizMode Component", () => {
  it("renders the current question", () => {
    render(
      <QuizMode
        questions={mockQuestions}
        currentIndex={0}
        feedback={null}
        t={mockT}
        onAnswer={vi.fn()}
        onPrev={vi.fn()}
        onNext={vi.fn()}
        onExit={vi.fn()}
      />,
    );
    expect(screen.getByText("What is 2+2?")).toBeDefined();
    expect(screen.getByText("4")).toBeDefined();
  });

  it("handles answer selection", () => {
    const onAnswer = vi.fn();
    render(
      <QuizMode
        questions={mockQuestions}
        currentIndex={0}
        feedback={null}
        t={mockT}
        onAnswer={onAnswer}
        onPrev={vi.fn()}
        onNext={vi.fn()}
        onExit={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText("4"));
    expect(onAnswer).toHaveBeenCalledWith(1);
  });

  it("displays feedback when provided", () => {
    render(
      <QuizMode
        questions={mockQuestions}
        currentIndex={0}
        feedback="Correct! Good job."
        t={mockT}
        onAnswer={vi.fn()}
        onPrev={vi.fn()}
        onNext={vi.fn()}
        onExit={vi.fn()}
      />,
    );
    expect(screen.getByText("Correct! Good job.")).toBeDefined();
  });

  it("disables navigation appropriately", () => {
    const onNext = vi.fn();
    render(
      <QuizMode
        questions={mockQuestions}
        currentIndex={0}
        feedback={null}
        t={mockT}
        onAnswer={vi.fn()}
        onPrev={vi.fn()}
        onNext={onNext}
        onExit={vi.fn()}
      />,
    );

    const prevBtn = screen.getByText("Vorige");
    const nextBtn = screen.getByText("Volgende");

    expect(prevBtn).toHaveProperty("disabled", true);
    expect(nextBtn).toHaveProperty("disabled", false);

    fireEvent.click(nextBtn);
    expect(onNext).toHaveBeenCalled();
  });
});
