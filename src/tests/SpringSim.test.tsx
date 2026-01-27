/* eslint-disable @typescript-eslint/no-explicit-any */
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// import React from 'react';
import { SpringStage as SpringSim } from "../features/physics/ui/modules/spring/SpringStage";

describe("SpringSim Component", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Mock Canvas
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      fillRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      createLinearGradient: () => ({ addColorStop: vi.fn() }),
      roundRect: vi.fn(), // If not supported in JSDOM, might need polyfill or simple mock
      fillText: vi.fn(),
    });

    // requestAnimationFrame mock
    vi.stubGlobal("requestAnimationFrame", (cb: any) => setTimeout(cb, 16));
    vi.stubGlobal("cancelAnimationFrame", (id: any) => clearTimeout(id));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("renders controls correctly", () => {
    render(<SpringSim mode="sidebar" />);
    expect(screen.getByText(/Massa \(m\)/i)).toBeDefined();
    expect(screen.getByText(/Veerconstante \(C\)/i)).toBeDefined();
  });

  it("toggles simulation running state", () => {
    render(<SpringSim mode="sidebar" />);
    const startBtn = screen.getByText("Start");
    fireEvent.click(startBtn);
    expect(screen.getByText("Stop")).toBeDefined();
  });

  it("resets simulation", () => {
    render(<SpringSim mode="sidebar" />);
    const startBtn = screen.getByText("Start");
    fireEvent.click(startBtn); // Start

    const resetBtn = screen.getByText("Reset");
    fireEvent.click(resetBtn); // Should stop and reset

    expect(screen.getByText("Start")).toBeDefined(); // Should be back to Start button
  });
});
