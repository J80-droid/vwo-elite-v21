import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// import React from 'react';
import { OrbitalSim } from "../features/simulation/OrbitalSim";

describe("OrbitalSim Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the sidebar correctly", () => {
    render(<OrbitalSim mode="sidebar" />);
    expect(screen.getByText("Quantum instellingen...")).toBeDefined();
  });

  it("renders main mode correctly", () => {
    render(<OrbitalSim mode="main" />);
    expect(screen.getByText("Quantum Orbitalen")).toBeDefined();
  });
});
