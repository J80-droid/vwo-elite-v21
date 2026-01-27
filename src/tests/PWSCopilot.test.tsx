/* eslint-disable @typescript-eslint/no-explicit-any */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// import React from 'react';
import { PWSCopilot } from "../pages/pwscopilot/ui/PWSCopilot";

// Mock Services
vi.mock("../components/pws", () => ({
  ChecklistWidget: () => <div data-testid="checklist-mock" />,
  SourcesPanel: () => <div data-testid="sources-mock" />,
  ChatPanel: () => <div data-testid="chat-mock" />,
}));

// Mock LabReportManager if used
vi.mock("../components/simulation/LabReportManager", () => ({
  LabReportManager: () => <div data-testid="lab-report-mock" />,
}));

vi.mock("../services/gemini", () => ({
  analyzePWSSources: vi.fn(),
  checkAcademicWriting: vi.fn(),
  findAcademicSources: vi.fn(),
  generateLiteratureMatrix: vi.fn(),
  summarizePaper: vi.fn(),
  checkOriginality: vi.fn(),
  generateAPACitations: vi.fn(),
  checkResearchDesign: vi.fn(),
}));

// Mock useTranslations
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
      aiConfig: {},
    },
  }),
}));

// Mock Hooks
vi.mock("../hooks/useLocalData", () => ({
  usePWSProjects: vi.fn(() => ({ data: [], refetch: vi.fn() })),
  useSavePWSProject: vi.fn(() => ({ mutateAsync: vi.fn() })),
  useDeletePWSProject: vi.fn(() => ({ mutateAsync: vi.fn() })),
  useSaveStudyMaterial: vi.fn(() => ({ mutateAsync: vi.fn() })),
  useStudyMaterialsByIds: vi.fn(() => ({ data: [], refetch: vi.fn() })),
}));

describe("PWSCopilot Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders project creation card when no projects exist", () => {
    render(<PWSCopilot />);
    expect(screen.getByText("Nieuw Project")).toBeDefined();
  });

  it("opens creation modal when clicking new project", () => {
    render(<PWSCopilot />);
    fireEvent.click(screen.getByText("Nieuw Project"));
    expect(
      screen.getByPlaceholderText(/Bijv. De Energietransitie/),
    ).toBeDefined();
  });

  it("switches tabs in active project", async () => {
    const { usePWSProjects } = await import("@shared/hooks/useLocalData");
    const mockProject = {
      id: "p1",
      title: "Klimaatverandering",
      subject: "Aardrijkskunde",
      researchQuestion: "Waarom wordt het warmer?",
      sources: [],
      updatedAt: Date.now(),
    };
    (usePWSProjects as any).mockReturnValue({
      data: [mockProject],
      refetch: vi.fn(),
    });

    render(<PWSCopilot />);

    // Click project
    fireEvent.click(screen.getByText("Klimaatverandering"));

    // Check tabs
    expect(screen.getByText("Chat")).toBeDefined();
    const searchTab = screen.getByText("Zoeken");
    fireEvent.click(searchTab);

    expect(
      screen.getByPlaceholderText(/Onderzoeksvraag of onderwerp/),
    ).toBeDefined();
  });

  it("triggers writing lab check", async () => {
    const { usePWSProjects } = await import("@shared/hooks/useLocalData");
    const { checkAcademicWriting } = await import("@shared/api/gemini");

    (usePWSProjects as any).mockReturnValue({
      data: [{ id: "p1", title: "Test", sources: [], updatedAt: Date.now() }],
      refetch: vi.fn(),
    });
    (checkAcademicWriting as any).mockResolvedValue("Goede toon.");

    render(<PWSCopilot />);
    fireEvent.click(screen.getByText("Test"));
    fireEvent.click(screen.getByText("Writing Lab"));

    const textarea = screen.getByPlaceholderText(/Plak hier je concept tekst/);
    fireEvent.change(textarea, {
      target: { value: "Hallo ik heb een vraag." },
    });

    fireEvent.click(screen.getByText("Tooncheck"));

    await waitFor(() => {
      expect(screen.getByText("Goede toon.")).toBeDefined();
    });
  });
});
