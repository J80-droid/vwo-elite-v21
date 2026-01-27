import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

// import React from 'react';
import { UltimateDashboard as Dashboard } from "../pages/dashboard/ui/UltimateDashboard";

describe("Dashboard Component", () => {
  it("should render dashboard title", () => {
    render(<Dashboard />);
    expect(screen.getByText("Mijn Voortgang")).toBeDefined();
  });

  it("should render subject shortcuts", () => {
    render(<Dashboard />);
    expect(screen.getByText("Wiskunde")).toBeDefined();
    expect(screen.getByText("Natuurkunde")).toBeDefined();
  });
});
