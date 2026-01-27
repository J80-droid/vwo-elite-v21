import "@testing-library/jest-dom";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ConstructionGame } from "../features/threed-studio/ui/views/ConstructionGame";

// Mock R3F
vi.mock("@react-three/fiber", () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => (
    <div>CanvasMock {children}</div>
  ),
  useFrame: vi.fn(),
}));
vi.mock("@react-three/drei", () => ({
  OrbitControls: () => null,
  PerspectiveCamera: () => null,
}));

// Mock Hooks & Utils
vi.mock("../hooks/useCanvasReady", () => ({
  useCanvasReady: () => ({ canvasReady: true }),
}));

vi.mock("../utils/voxelUtils", () => ({
  generateStructure: () => [
    [0, 0, 0],
    [1, 0, 0],
  ],
  Vec3: Array,
}));

vi.mock("../shared/utils/geometry", () => ({
  checkRotationMatch: () => ({
    matched: false,
    correct: 0,
    extra: 0,
    missing: 0,
    rotationIndex: 0,
  }),
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

describe("ConstructionGame Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render initial menu", () => {
    render(<ConstructionGame />);
    expect(screen.getByText(/Constructie Challenge/i)).toBeInTheDocument();
    expect(screen.getByText("Ghost")).toBeInTheDocument();
    expect(screen.getByText("Projection")).toBeInTheDocument();
    expect(screen.getByText("Sandbox")).toBeInTheDocument();
  });

  it("should start creative sandbox mode", async () => {
    render(<ConstructionGame />);

    fireEvent.click(screen.getByText("Sandbox"));

    await waitFor(() => {
      expect(
        screen.getByText("LMB: Plaats", { exact: false }),
      ).toBeInTheDocument();
      expect(screen.getByText("Opslaan")).toBeInTheDocument();
    });
  });

  it("should handle VWO context button", () => {
    render(<ConstructionGame />);
    const btn = screen.getByText(/VWO Context/i);
    fireEvent.click(btn);

    // Should show question overlay
    expect(screen.getByText(/Examenvraag Context/i)).toBeInTheDocument();
  });
});
