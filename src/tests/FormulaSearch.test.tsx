import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// import React from 'react';
import { FormulaSearch } from "../pages/formulasearch/ui/FormulaSearch";

// Mock LabReportManager
vi.mock("../simulation", () => ({
  LabReportManager: () => <div>LabReportManager</div>,
}));

describe("FormulaSearch Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render formula list and search bar", () => {
    render(<FormulaSearch />);
    expect(screen.getByText(/Binas.Core.v4/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Zoek formule/i)).toBeInTheDocument();
    // Should show default selection (Newton)
    expect(screen.getByText(/Tweede Wet van Newton/i)).toBeInTheDocument();
  });

  it("should filter formulas", () => {
    render(<FormulaSearch />);
    const input = screen.getByPlaceholderText(/Zoek formule/i);

    // Search for something unique
    fireEvent.change(input, { target: { value: "Veerenergie" } });

    expect(screen.getByText("Veerenergie")).toBeInTheDocument();
  });
});
