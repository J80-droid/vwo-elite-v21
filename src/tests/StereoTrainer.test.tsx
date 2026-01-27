/* eslint-disable @typescript-eslint/no-explicit-any */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// import React from 'react';
import { StereoTrainer } from "../features/threed-studio/ui/modules/stereo/StereoTrainer";

// Mock R3F
vi.mock("@react-three/fiber", () => ({
  Canvas: ({ children }: any) => <div>CanvasMock {children}</div>,
  useFrame: vi.fn(),
}));
vi.mock("@react-three/drei", () => ({
  OrbitControls: () => null,
  PerspectiveCamera: () => null,
  Html: ({ children }: any) => <div>{children}</div>,
  Line: () => null,
}));

// Mock Hooks & Utils
vi.mock("../hooks/useCanvasReady", () => ({
  useCanvasReady: () => ({ canvasReady: true }),
}));

vi.mock("../services/aiCascadeService", () => ({
  aiGenerateJSON: vi.fn(),
}));

vi.mock("../data/molecules", () => ({
  // Mock constants
  ATOM_COLORS: { C: "#000" },
  ATOM_RADII: { C: 1 },
  MOLECULES: [],
  // Mock functions
  getRandomMolecule: vi.fn(() => ({
    name: "TestMol",
    atoms: [],
    bonds: [],
    difficulty: "easy",
  })),
  mirrorMolecule: vi.fn((m) => m),
  rotateMolecule: vi.fn((m) => m),
  validateMolecule: vi.fn(() => []),
}));

// Mock Sound
window.AudioContext = vi.fn().mockImplementation(() => ({
  createOscillator: vi.fn().mockReturnValue({
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    frequency: { setValueAtTime: vi.fn() },
    type: "sine",
  }),
  createGain: vi.fn().mockReturnValue({
    connect: vi.fn(),
    gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
  }),
  currentTime: 0,
  destination: {},
}));

describe("StereoTrainer Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render initial start screen", () => {
    render(<StereoTrainer />);
    expect(screen.getByText("Stereo-Isomerie")).toBeInTheDocument();
    expect(screen.getByText(/Start Training/i)).toBeInTheDocument();
  });

  it("should start game and render questions", async () => {
    render(<StereoTrainer />);

    // Start Game
    fireEvent.click(screen.getByText(/Start Training/i));

    await waitFor(() => {
      expect(screen.getByText("Bepaal Relatie")).toBeInTheDocument();
      expect(screen.getByText("Hetzelfde")).toBeInTheDocument();
    });
  });

  it("should switch modes in menu", () => {
    render(<StereoTrainer />);
    const buildBtn = screen.getByText(/Fischer Bouwer/i);
    fireEvent.click(buildBtn);

    expect(screen.getByText(/Start Bouwen/i)).toBeInTheDocument();
  });
});
