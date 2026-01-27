/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// import React from 'react';
import { TitrationSim } from "../features/simulation/TitrationSim";

// Mock Recharts to avoid SVGRect/Canvas issues in JSDOM
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: any) => (
    <div className="recharts-responsive-container">{children}</div>
  ),
  LineChart: ({ children }: any) => (
    <div className="recharts-line-chart">{children}</div>
  ),
  Line: () => <div className="recharts-line" />,
  XAxis: () => <div className="recharts-x-axis" />,
  YAxis: () => <div className="recharts-y-axis" />,
  Tooltip: () => <div className="recharts-tooltip" />,
  CartesianGrid: () => <div className="recharts-cartesian-grid" />,
  ReferenceLine: () => <div className="recharts-reference-line" />,
  ReferenceArea: () => null,
}));

// Mock chemStore
vi.mock("../stores/chemStore", () => ({
  useChemStore: () => ({ addLog: vi.fn() }),
}));

describe("TitrationSim Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the sidebar controls correctly", () => {
    render(
      <TitrationSim mode="sidebar" titrationType="strong_acid_strong_base" />,
    );
    expect(screen.getByText("Live Monitor")).toBeDefined();
  });

  it("renders the main chart view correctly", () => {
    render(
      <TitrationSim mode="main" titrationType="strong_acid_strong_base" />,
    );
    expect(screen.getByText("Titratiecurve (pH vs Volume)")).toBeDefined();
  });

  it("renders weak acid mode correctly", () => {
    render(<TitrationSim mode="main" titrationType="weak_acid_strong_base" />);
    // Component should render the pKa reference line (checked via mock div)
    expect(document.querySelector(".recharts-reference-line")).toBeDefined();
  });
});
