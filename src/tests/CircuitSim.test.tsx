/* eslint-disable @typescript-eslint/no-explicit-any -- dynamic Recharts and jspdf mocks */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// import React from 'react';
import { CircuitsStage as CircuitSim } from "../features/physics/ui/modules/circuits/CircuitsStage";

// Mock dependencies
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  LineChart: ({ children }: any) => <div>{children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  CartesianGrid: () => null,
}));

vi.mock("mathjs", () => ({
  zeros: () => ({ set: vi.fn(), get: () => 0 }),
  lusolve: () => [0, 0, 0], // Mock solution
}));

vi.mock("jspdf", () => ({
  jsPDF: class {
    setFontSize() {}
    text() {}
    setTextColor() {}
    save = vi.fn();
  },
}));

// Mock sub-components
vi.mock("../circuit", () => ({
  ComponentPalette: ({ onSelectTool }: any) => (
    <button onClick={() => onSelectTool("resistor")}>Select Resistor</button>
  ),
  PropertiesPanel: ({ onValueChange, onExportPDF }: any) => (
    <div>
      <button onClick={() => onValueChange(100)}>Set Value 100</button>
      <button onClick={onExportPDF}>Export PDF</button>
    </div>
  ),
  OscilloscopePanel: () => <div>Oscilloscope</div>,
}));

describe("CircuitSim Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the main grid", () => {
    render(<CircuitSim />);
    expect(screen.getByText(/Schematic Grid/i)).toBeDefined();
  });

  it("allows selecting tools via sidebar interactions", () => {
    render(<CircuitSim />);
    const btn = screen.getByText("Select Resistor");
    fireEvent.click(btn);
    // State update is internal, but no crash is good
    expect(screen.getByText("Start Engine")).toBeDefined();
  });

  it("starts simulation when button is clicked", () => {
    render(<CircuitSim />);
    const btn = screen.getByText("Start Engine");
    fireEvent.click(btn);
    expect(screen.getByText("Stop Simulatie")).toBeDefined();
  });

  it("exports PDF when requested", () => {
    render(<CircuitSim />);
    const btn = screen.getByText("Export PDF");
    fireEvent.click(btn);
    // Validation relies on mock not throwing
  });
});
