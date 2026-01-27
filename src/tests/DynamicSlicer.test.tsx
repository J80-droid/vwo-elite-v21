/* eslint-disable @typescript-eslint/no-explicit-any */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// import React from 'react';
import { DynamicSlicer } from "../features/threed-studio/ui/views/DynamicSlicer";

// Mock R3F
vi.mock("@react-three/fiber", () => ({
  Canvas: ({ children }: any) => <div>CanvasMock {children}</div>,
  useFrame: vi.fn(),
  useThree: vi.fn(() => ({ camera: {}, scene: {} })),
}));
vi.mock("@react-three/drei", () => ({
  OrbitControls: () => null,
  PerspectiveCamera: () => null,
  Edges: () => null,
  Html: ({ children }: any) => <div>{children}</div>,
}));

// Mock Hooks
vi.mock("../hooks/useCanvasReady", () => ({
  useCanvasReady: () => ({ canvasReady: true }),
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

describe("DynamicSlicer Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render start screen", () => {
    render(<DynamicSlicer />);
    expect(screen.getByText("Slicer Challenge")).toBeInTheDocument();
    expect(screen.getByText("Start Challenge")).toBeInTheDocument();
  });

  it("should start game and show task", async () => {
    render(<DynamicSlicer />);

    fireEvent.click(screen.getByText("Start Challenge"));

    await waitFor(() => {
      expect(
        screen.getByText("Maak een", { exact: false }),
      ).toBeInTheDocument();
      expect(screen.getByText("Snijd Nu")).toBeInTheDocument();
    });
  });

  it("should handle exam mode selection", async () => {
    render(<DynamicSlicer />);
    fireEvent.click(screen.getByText("Start Challenge"));

    await waitFor(() => {
      expect(
        screen.getByText("Of kies een examen opgave:", { exact: false }),
      ).toBeInTheDocument();
    });
  });
});
