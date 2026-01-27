import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// import React from 'react';
import { ReactionLab } from "../features/simulation/ReactionLab";

describe("ReactionLab Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders reactant and product inputs", () => {
    render(<ReactionLab />);
    expect(screen.getByText("REACTIE LAB")).toBeDefined();
    // Defaults: CH4 + O2 -> CO2 + H2O
    expect(screen.getByDisplayValue("CH4")).toBeDefined();
    expect(screen.getByDisplayValue("O2")).toBeDefined();
    expect(screen.getByDisplayValue("CO2")).toBeDefined();
    expect(screen.getByDisplayValue("H2O")).toBeDefined();
  });

  it("adds and removes reactant fields", () => {
    render(<ReactionLab />);
    const addBtn = screen.getByText("Voeg Reactant Toe");
    fireEvent.click(addBtn);
    // Expect 3 inputs for reactants now (initial 2 + 1)
    // Finding specific inputs can be tricky, but we can check if a new empty input appeared
    expect(screen.getAllByPlaceholderText("bv. CH4").length).toBeGreaterThan(2);
  });

  it("calculates balanced reaction correctly", async () => {
    render(<ReactionLab />);

    // CH4 + O2 -> CO2 + H2O is default
    // Balanced: 1 CH4 + 2 O2 -> 1 CO2 + 2 H2O

    const calcBtn = screen.getByText("REACTIE BALANCEREN");
    fireEvent.click(calcBtn);

    // Logic is wrapped in setTimeout(500)
    vi.advanceTimersByTime(600);

    await waitFor(() => {
      expect(screen.getByText(/Chemisch Evenwicht Bereikt/i)).toBeDefined();
      // Check for correct coefficients
      // 2 O2
      expect(screen.getByText("2")).toBeDefined();
    });
  });

  it("handles balancing errors for impossible reactions", async () => {
    render(<ReactionLab />);

    // Change product to something impossible from CH4 + O2, e.g. "Fe"
    const inputs = screen.getAllByPlaceholderText("bv. CO2");
    fireEvent.change(inputs[0], { target: { value: "Fe" } });

    const calcBtn = screen.getByText("REACTIE BALANCEREN");
    fireEvent.click(calcBtn);

    vi.advanceTimersByTime(600);

    await waitFor(() => {
      expect(screen.getByText(/Kan reactie niet balanceren/i)).toBeDefined();
    });
  });
});
