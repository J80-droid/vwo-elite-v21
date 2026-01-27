/* eslint-disable @typescript-eslint/no-explicit-any -- dynamic UI mocks and R3F/Plotly props */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// import React from 'react';
import { MathLabModern as MathLab } from "../pages/mathlabmodern/ui/MathLabModern";

// Mock Services
vi.mock("../components/visualization/GraphPlotter", () => ({
  GraphPlotter: ({ functions }: any) => (
    <div data-testid="graph-plotter-mock">
      {functions.map((fn: string, i: number) => (
        <div key={i}>
          f{i + 1}(x) = {fn}
        </div>
      ))}
    </div>
  ),
}));

vi.mock("../components/visualization/SurfacePlotter", () => ({
  SurfacePlotter: () => <div data-testid="surface-plotter-mock" />,
}));

vi.mock("../components/visualization/SciPlotter", () => ({
  SciPlotter: () => <div data-testid="sci-plotter-mock" />,
}));

vi.mock("../components/simulation/LabReportManager", () => ({
  LabReportManager: () => <div data-testid="lab-report-mock" />,
}));

vi.mock("../services/gemini", () => ({
  solveCalculus: vi.fn(),
}));

// Mock plotting and 3D libs
vi.mock("react-plotly.js", () => ({
  default: () => <div data-testid="plotly-mock" />,
}));

vi.mock("@react-three/fiber", () => ({
  Canvas: ({ children }: any) => (
    <div data-testid="r3f-canvas-mock">{children}</div>
  ),
}));

vi.mock("@react-three/drei", () => ({
  OrbitControls: () => null,
  Grid: () => null,
  PerspectiveCamera: () => null,
  Stars: () => null,
  Line: () => null,
  Html: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("react-katex", () => ({
  InlineMath: ({ math }: any) => <span>{math}</span>,
  BlockMath: ({ math }: any) => <div>{math}</div>,
}));

// Mock useTranslations hook
vi.mock("../hooks/useTranslations", () => ({
  useTranslations: () => ({
    t: {
      math: {
        analytics: "Analytics",
        symbolic: "Symbolic",
        visual_3d: "3D Visual",
        vectors: "Vectors",
        solve: "Oplossen",
      },
    },
    lang: "nl",
  }),
}));

describe("MathLab Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the default analytics module", async () => {
    render(<MathLab />);

    const input = screen.getByPlaceholderText(/y = x\^2\.\.\./);
    fireEvent.change(input, { target: { value: "x^2" } });
    fireEvent.click(screen.getByLabelText("Add Function"));

    // Check for the mocked GraphPlotter output
    expect(await screen.findByText(/f1\(x\)/)).toBeDefined();
    expect(screen.getByText(/x\^2/)).toBeDefined();
  });

  it("switches to symbolic module and solves equation", async () => {
    const { solveCalculus } = await import("@shared/api/gemini");
    (solveCalculus as any).mockResolvedValue({
      steps: ["Stap 1: ..."],
      finalAnswer: "x^2",
      rule: "Machtsregel",
    });

    render(<MathLab />);

    // Switch to Symbolic
    fireEvent.click(screen.getByText("Symbolisch"));

    const input = screen.getByPlaceholderText(/x\^3 \* sin\(x\)/);
    fireEvent.change(input, { target: { value: "x^2" } });

    fireEvent.click(screen.getByText("AI Step-Solve"));

    await waitFor(() => {
      expect(screen.getByText(/Stap 1:/)).toBeDefined();
    });
  });

  it("switches to 3D Visualization", async () => {
    render(<MathLab />);
    fireEvent.click(screen.getByText("3D Visuals"));

    expect(await screen.findByTestId("surface-plotter-mock")).toBeDefined();
    expect(screen.getByText("Z = f(X, Y)")).toBeDefined();
  });
});
