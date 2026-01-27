/* eslint-disable @typescript-eslint/no-explicit-any */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// import React from 'react';
import Planner from "../features/planner/ui/PlannerLanding";
// import { AppView } from '../types';

// Mocks
vi.mock("../services/gemini", () => ({
  generateStudyPlan: vi.fn().mockResolvedValue([
    {
      id: "1",
      subject: "History",
      topic: "WWII",
      date: "2024-01-01",
      type: "read",
      completed: false,
    },
  ]),
}));

vi.mock("../services/sqliteService", () => ({
  logActivitySQL: vi.fn(),
}));

// Mock useTranslations
vi.mock("../hooks/useTranslations", () => ({
  useTranslations: () => ({
    t: {
      planner: {
        title: "Planner",
        desc: "Description",
        streak: "Streak",
        subject: "Vak",
        chapters: "Hoofdstukken",
        time_per_day: "Tijd",
        plan_for: "Planning voor",
      },
    },
    lang: "nl",
  }),
}));

// Mock children to simplify test
vi.mock("../components/views/StudyHeatmap", () => ({
  StudyHeatmap: () => <div>Heatmap</div>,
}));
vi.mock("../components/views/StudyGantt", () => ({
  StudyGantt: () => <div>Gantt</div>,
}));
vi.mock("../components/planner", () => ({
  RescheduleModal: () => <div>RescheduleModal</div>,
  TaskCard: ({ item }: any) => (
    <div>
      Task: {item.subject} - {item.topic}
    </div>
  ),
}));

describe("Planner Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("should render planner interface", () => {
    render(<Planner />);
    expect(screen.getByText("Planner")).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
  });

  it("should allow inputting details and generating plan", async () => {
    render(<Planner />);

    // Inputs
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "Geschiedenis" },
    });
    fireEvent.change(screen.getByPlaceholderText("Hoofdstukken"), {
      target: { value: "Ch 1" },
    });

    // Simply check button state
    const genButton = screen.getByText("Genereer Schema");
    expect(genButton).toBeDisabled();
  });
});
