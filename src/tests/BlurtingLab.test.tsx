/* eslint-disable @typescript-eslint/no-explicit-any */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// import React from 'react';
import { BlurtingLab } from "../pages/blurtinglab/ui/BlurtingLab";

// Mock Services
vi.mock("../services/gemini", () => ({
  analyzeBlurting: vi.fn(),
}));

// Mock useTranslations since BlurtingLab uses it internally
vi.mock("../hooks/useTranslations", () => ({
  useTranslations: () => ({
    t: {
      snap: {
        btn_analyze: "Analyseer Mijn Kennis",
      },
    },
    lang: "nl",
  }),
}));

// Mock useSettings
vi.mock("../hooks/useSettings", () => ({
  useSettings: () => ({
    settings: {
      aiConfig: {},
      speechRecognitionEnabled: false,
    },
  }),
}));

describe("BlurtingLab Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the setup phase correctly", () => {
    render(<BlurtingLab />);

    expect(screen.getByText("Active Recall")).toBeDefined();
    expect(screen.getByPlaceholderText(/Onderwerp/i)).toBeDefined();
  });

  it("transitions to active phase when topic is entered", () => {
    render(<BlurtingLab />);
    const input = screen.getByPlaceholderText(/Onderwerp/i);
    const button = screen.getByText("Start Brain Dump");

    fireEvent.change(input, { target: { value: "Quantumbiologie" } });
    fireEvent.click(button);

    expect(screen.getByText(/Onderwerp:/i)).toBeDefined();
    expect(screen.getByText("Quantumbiologie")).toBeDefined();
  });

  it("submits content and displays feedback", async () => {
    const { analyzeBlurting } = await import("@shared/api/gemini");
    (analyzeBlurting as any).mockResolvedValue({
      score: 75,
      misconceptions: ["Quantum is niet magie."],
      missingPoints: ["Tunneling effect."],
      feedback: "Goed gedaan voor een begin.",
    });

    render(<BlurtingLab />);

    // Setup
    fireEvent.change(screen.getByPlaceholderText(/Onderwerp/i), {
      target: { value: "Quantum" },
    });
    fireEvent.click(screen.getByText("Start Brain Dump"));

    // Typing
    const textarea = screen.getByPlaceholderText(/Typ alles wat je weet/i);
    fireEvent.change(textarea, {
      target: { value: "Quantum gaat over kleine deeltjes." },
    });

    // Analyze
    fireEvent.click(screen.getByText("Analyseer Mijn Kennis"));

    // Wait for result
    await waitFor(() => {
      expect(screen.getByText("Score: 75")).toBeDefined();
      expect(screen.getByText("⚠️ Misconcepties")).toBeDefined();
    });

    expect(analyzeBlurting).toHaveBeenCalledWith(
      "Quantum",
      "Quantum gaat over kleine deeltjes.",
      {},
    );
    expect(screen.getByText("Tunneling effect.")).toBeDefined();
  });
});
