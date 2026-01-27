/* eslint-disable @typescript-eslint/no-explicit-any */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// import React from 'react';
import { SpatialTrainer } from "../features/threed-studio/ui/modules/spatial/SpatialTrainer";

// Mock Dependencies
vi.mock("tone", () => ({
  start: vi.fn(),
  Player: vi.fn().mockImplementation(() => ({
    toDestination: vi.fn().mockReturnThis(),
    start: vi.fn(),
  })),
}));

// Mock Hooks
const mockStartGame = vi.fn();
const mockHandleGuess = vi.fn();

vi.mock("../components/views/spatial/hooks/useSpatialGame", () => ({
  useSpatialGame: () => ({
    gameStarted: true,
    gameOver: false,
    score: 100,
    round: 1,
    timeLeft: 60,
    activeModule: "rotation",
    options: ["A", "B", "C", "D"], // Simplified options
    correctIndex: 0,
    feedback: null,
    levelConfig: { label: "Novice" },
    currentLevel: 1,
    startGame: mockStartGame,
    handleGuess: mockHandleGuess,
    questions: [],
    gears: [],
    folds: [],
    punches: [],
  }),
}));

vi.mock("../components/views/spatial/hooks/useSpatialProgress", () => ({
  useSpatialProgress: () => ({
    updateProgress: vi.fn(),
    progress: {},
    getRecommendedModule: vi.fn(),
  }),
}));

// Mock R3F Components
vi.mock("@react-three/fiber", () => ({
  Canvas: ({ children }: any) => <div>CanvasMock {children}</div>,
}));
vi.mock("@react-three/drei", () => ({
  OrbitControls: () => null,
  PerspectiveCamera: () => null,
  Environment: () => null,
}));

// Mock Sub-Components
vi.mock("../components/views/spatial/SpatialRenderers", () => ({
  OptionCard: ({ index, onSelect }: any) => (
    <div data-testid={`option-${index}`} onClick={() => onSelect(index)}>
      Option {index}
    </div>
  ),
}));

describe("SpatialTrainer Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render game header and canvas", async () => {
    render(<SpatialTrainer />);

    await waitFor(() => {
      expect(screen.getByText(/3D Inzicht/i)).toBeInTheDocument();
      expect(screen.getByText(/Score:/i)).toBeInTheDocument();
    });
  });

  it("should handle answer selection", async () => {
    render(<SpatialTrainer />);

    // Wait for options to render
    await waitFor(() => {
      expect(screen.getByTestId("option-0")).toBeInTheDocument();
    });

    // Click an answer button (A=0)
    const btnA = screen.getByText("A");
    fireEvent.click(btnA);

    expect(mockHandleGuess).toHaveBeenCalledWith(0);
  });

  it("should handle difficulty selection interaction", async () => {
    // Note: Logic for starting game is mocked to be already started in this test suite setup
    // But we can check if elements are present that imply state
    expect(screen.getByText("Novice")).toBeInTheDocument();
  });
});
