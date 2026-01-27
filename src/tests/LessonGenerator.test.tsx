/* eslint-disable @typescript-eslint/no-explicit-any -- dynamic UI mocks and browser global extensions */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// import React from 'react';
import { LessonGenerator } from "../pages/lessongenerator/ui/LessonGenerator";

// Mock Services
vi.mock("../services/gemini", () => ({
  generateLesson: vi.fn(),
  generateQuizFromMaterials: vi.fn(),
  generatePodcastAudio: vi.fn(),
}));

vi.mock("../services/huggingFaceService", () => ({
  generateImageHF: vi.fn(),
}));

// Mock useTranslations
vi.mock("../hooks/useTranslations", () => ({
  useTranslations: () => ({
    t: {
      LessonGenerator: {
        upload_desc: "Upload material",
        library: "Material Library",
        generate_btn: "Generate Lesson",
        progress_analyzing: "Analyzing...",
        progress_done: "Done!",
        saved_lessons: "Saved Lessons",
      },
      lesson: {
        upload_desc: "Upload material",
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
    },
  }),
}));

// Mock Hooks
vi.mock("../hooks/useLocalData", () => ({
  useStudyMaterials: vi.fn(() => ({ data: [], refetch: vi.fn() })),
  useMaterialsBySubject: vi.fn(() => ({ data: [], refetch: vi.fn() })),
  useSaveStudyMaterial: vi.fn(() => ({ mutateAsync: vi.fn() })),
  useDeleteStudyMaterial: vi.fn(() => ({ mutateAsync: vi.fn() })),
  useSaveFlashcard: vi.fn(() => ({ mutateAsync: vi.fn() })),
}));

// Mock html2pdf
vi.mock("html2pdf.js", () => ({
  default: vi.fn(() => ({
    set: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    save: vi.fn(),
  })),
}));

// Mock browser globals
global.URL.createObjectURL = vi.fn(() => "mock-url");
global.URL.revokeObjectURL = vi.fn();
global.crypto.randomUUID = vi.fn(() => "mock-uuid") as any;

// Mock react-router-dom
vi.mock("react-router-dom", () => ({
  useParams: vi.fn(() => ({ subject: "Natuurkunde" })),
  useNavigate: vi.fn(() => vi.fn()),
  useLocation: vi.fn(() => ({ pathname: "/" })),
}));

describe("LessonGenerator Component", () => {
  //     const subject = 'Natuurkunde';

  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset useParams mock for each test if needed
    const { useParams } = await import("react-router-dom");
    (vi.mocked(useParams) as any).mockReturnValue({ subject: "Natuurkunde" });
  });

  it("renders correctly and shows upload zone", () => {
    render(<LessonGenerator />);
    expect(screen.getByText("Natuurkunde")).toBeDefined();
  });

  it("generates a lesson when materials are selected", async () => {
    const { useMaterialsBySubject } =
      await import("@shared/hooks/useLocalData");
    const { generateLesson } = await import("@shared/api/gemini");

    (useMaterialsBySubject as any).mockReturnValue({
      data: [
        { id: "1", name: "Newton.txt", type: "txt", content: "Laws of motion" },
      ],
      refetch: vi.fn(),
    });

    (generateLesson as any).mockResolvedValue({
      title: "Newton",
      summary: "Summary",
      sections: [{ heading: "Law 1", content: "Inertia" }],
      keyConcepts: ["Inertia"],
    });

    render(<LessonGenerator />);

    // Select material
    const materialItem = screen.getByText("Newton.txt");
    fireEvent.click(materialItem.parentElement!);

    // Click generate
    const generateBtn = screen.getByText(/Generate Lesson/);
    fireEvent.click(generateBtn);

    // Wait for results
    await waitFor(
      () => {
        expect(generateLesson).toHaveBeenCalled();
      },
      { timeout: 5000 },
    );
  });

  it("handles lesson renaming", async () => {
    // Mock localStorage to have a lesson
    const mockLesson = {
      id: "lesson-1",
      title: "Original Title",
      summary: "...",
      sections: [],
      keyConcepts: [],
    };
    localStorage.setItem(
      "VWO_ELITE_LESSONS_Natuurkunde",
      JSON.stringify([mockLesson]),
    );

    render(<LessonGenerator />);

    expect(await screen.findByText("Original Title")).toBeDefined();

    // Click rename button (first button in list usually)
    const renameBtn = screen.getByTitle("Hernoemen", { exact: false } as any);
    fireEvent.click(renameBtn);

    // Input new title
    const input = screen.getByDisplayValue("Original Title");
    fireEvent.change(input, { target: { value: "New Better Title" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    await waitFor(() => {
      expect(screen.getByText("New Better Title")).toBeDefined();
    });
  });
});
