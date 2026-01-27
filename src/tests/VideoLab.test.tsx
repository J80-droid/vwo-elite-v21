/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  generateEducationalImage,
  generateVeoVideo,
} from "@shared/api/gemini/media";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// import React from 'react';
import { VideoLab } from "../pages/videolab/ui/VideoLab";

// Mock Services
vi.mock("@shared/api/gemini/media", () => ({
  generateVeoVideo: vi.fn(),
  generateEducationalImage: vi.fn(),
}));

// Mock SQLite Service (Alias)
vi.mock("@shared/api/sqliteService", () => ({
  getAllGeneratedMediaSQL: vi.fn().mockResolvedValue([]),
  saveGeneratedMediaSQL: vi.fn().mockResolvedValue(true),
  deleteGeneratedMediaSQL: vi.fn().mockResolvedValue(true),
  initDatabase: vi.fn().mockResolvedValue({}),
}));
// Mock SQLite Service (Relative - Backup)
vi.mock("../shared/api/sqliteService", () => ({
  getAllGeneratedMediaSQL: vi.fn().mockResolvedValue([]),
  saveGeneratedMediaSQL: vi.fn().mockResolvedValue(true),
  deleteGeneratedMediaSQL: vi.fn().mockResolvedValue(true),
  initDatabase: vi.fn().mockResolvedValue({}),
}));

// Mock useTranslations since VideoLab uses it internally
vi.mock("@shared/hooks/useTranslations", () => ({
  useTranslations: () => ({
    t: {
      VideoLab: {
        vid_title: "Video Lab",
        vid_desc: "Generate educational videos and diagrams",
        prompt: "Describe the video...",
        img_title: "Diagram Generator",
        img_prompt: "Prompt for diagram...",
      },
    },
    lang: "nl",
  }),
}));

describe("VideoLab Component", () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
    (generateVeoVideo as any).mockResolvedValue("https://video.url");
    (generateEducationalImage as any).mockResolvedValue("https://image.url");
  });

  it("should render video and image generation sections", async () => {
    render(<VideoLab />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText("Video Lab")).toBeInTheDocument();
    });
  });

  it("should allow generating image", async () => {
    render(<VideoLab />, { wrapper });

    // Wait for initial load
    await waitFor(() => screen.getByText("Diagram Generator"));

    const imgInput = screen.getByPlaceholderText("Prompt for diagram...");
    fireEvent.change(imgInput, { target: { value: "Test Image" } });

    const genBtns = screen.getAllByText("Generate");
    // The second button is for image generation
    fireEvent.click(genBtns[1]);

    await waitFor(() => {
      expect(generateEducationalImage).toHaveBeenCalledWith("Test Image", "1K");
    });
  });
});
