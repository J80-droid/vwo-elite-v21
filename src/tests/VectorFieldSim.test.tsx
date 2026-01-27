/* eslint-disable @typescript-eslint/no-explicit-any */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// import React from 'react';
import { VectorFieldSim } from "../features/simulation/VectorFieldSim";

// Mock Three.js / Fiber
vi.mock("@react-three/fiber", () => ({
  Canvas: ({ children }: any) => <div>{children}</div>,
  useFrame: vi.fn(),
}));

vi.mock("@react-three/drei", () => ({
  OrbitControls: () => null,
  PerspectiveCamera: () => null,
  Stars: () => null,
}));

// Mock hooks
vi.mock("../../hooks/useCanvasReady", () => ({
  useCanvasReady: () => ({ canvasReady: true }),
}));

describe("VectorFieldSim Component", () => {
  it("renders sidebar controls", () => {
    render(<VectorFieldSim mode="sidebar" />);
    expect(screen.getByText("Veldtype")).toBeDefined();
    expect(screen.getByText("Elektrisch Veld (E)")).toBeDefined();
  });

  it("switches field types", () => {
    render(<VectorFieldSim mode="sidebar" />);
    const magBtn = screen.getByText("B-Veld (Stroomdraad)");
    fireEvent.click(magBtn);
    // If magnetic field is selected, charges section (Electric only) should disappear
    expect(screen.queryByText(/Configuratie Lading/i)).toBeNull();
  });

  it("toggles induction mode for Solenoid", () => {
    render(<VectorFieldSim mode="sidebar" />);

    // Switch to Solenoid
    const solBtn = screen.getByText("B-Veld (Spoel)");
    fireEvent.click(solBtn);

    const indBtn = screen.getByText(/Inductie Modus/i);
    fireEvent.click(indBtn);

    expect(screen.getByText("Inductie Modus ON")).toBeDefined();
  });
});
