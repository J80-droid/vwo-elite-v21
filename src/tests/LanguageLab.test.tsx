/* eslint-disable @typescript-eslint/no-explicit-any -- dynamic Speech API and mediaDevice mocks */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// import React from 'react';
import { LanguageLabLayout as LanguageLab } from "../features/language/ui/LanguageLabLayout";

// Mock Services
vi.mock("../services/gemini", () => ({
  connectLiveSession: vi.fn(),
  generateLanguageFeedback: vi.fn(),
}));

// Mock useTranslations since LanguageLab uses it internally
vi.mock("../hooks/useTranslations", () => ({
  useTranslations: () => ({
    t: {},
    lang: "nl",
  }),
}));

// Mock useSettings
vi.mock("../hooks/useSettings", () => ({
  useSettings: () => ({
    settings: {
      speechRecognitionEnabled: true,
    },
  }),
}));

// Mock MediaDevices
Object.defineProperty(navigator, "mediaDevices", {
  value: {
    getUserMedia: vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }],
    }),
  },
  writable: true,
});

// Mock SpeechRecognition
class MockSpeechRecognition {
  continuous = false;
  interimResults = false;
  lang = "";
  start = vi.fn();
  stop = vi.fn();
  onresult = null;
}
(window as any).webkitSpeechRecognition = MockSpeechRecognition;

describe("LanguageLab Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the scenario selection correctly", () => {
    render(<LanguageLab />);

    expect(screen.getByText("Talen Lab")).toBeDefined();
    expect(screen.getByText("Literatuur Discussie")).toBeDefined();
    expect(screen.getByText("Sollicitatiegesprek")).toBeDefined();
  });

  it("starts a session when a scenario is clicked", async () => {
    const { connectLiveSession } = await import("@shared/api/gemini");
    (connectLiveSession as any).mockResolvedValue({
      sendAudio: vi.fn(),
      close: vi.fn(),
    });

    render(<LanguageLab />);

    const scenario = screen.getByText("Literatuur Discussie");
    fireEvent.click(scenario);

    await waitFor(() => {
      expect(screen.getByText("Stop & Analyseer")).toBeDefined();
    });

    expect(connectLiveSession).toHaveBeenCalled();
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
  });

  it("stops the session and calls for feedback", async () => {
    const { connectLiveSession, generateLanguageFeedback } =
      await import("@shared/api/gemini");
    (connectLiveSession as any).mockResolvedValue({
      sendAudio: vi.fn(),
      close: vi.fn(),
    });
    (generateLanguageFeedback as any).mockResolvedValue({
      grammarScore: 8,
      vocabularyScore: 7,
      pronunciationScore: 9,
      grammarFeedback: "Goed bezig.",
      vocabularyFeedback: "Meer synoniemen gebruiken.",
      generalTips: "Blijf oefenen.",
    });

    render(<LanguageLab />);

    // Start
    fireEvent.click(screen.getByText("Literatuur Discussie"));

    // Wait for connection
    await screen.findByText("Stop & Analyseer");

    // Stop
    fireEvent.click(screen.getByText("Stop & Analyseer"));

    // Wait for feedback report
    await waitFor(() => {
      expect(screen.getByText("Jouw Feedback Rapport")).toBeDefined();
    });

    expect(generateLanguageFeedback).toHaveBeenCalled();
    expect(screen.getByText("8/10")).toBeDefined(); // Grammar score
  });
});
