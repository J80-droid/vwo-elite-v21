import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OpticsSim } from "../features/simulation/OpticsSim";

// 1. Mock Translations
vi.mock("../hooks/useTranslations", () => ({
  useTranslations: () => ({
    t: (key: string) => key,
  }),
}));

// 2. MOCK ENGINE
const mockSetParam = vi.fn();

const mockState = {
  focalLength: 100,
  objectDistance: 200,
  objectHeight: 60,
  lensType: "convex",
  showRays: true,
  showValues: true,
  showFormula: true,
  glassesDiopters: 0,
  eyeAccommodation: 50,
};

vi.mock("@features/physics/ui/modules/optics/useOpticsEngine", () => ({
  useOpticsEngine: () => ({
    state: mockState,
    derived: {
      f_eff: 100,
      v: 200,
      m: -1,
      S: 10,
      isVirtual: false,
      imageHeight: -60,
      hasImage: true,
    },
    setParam: (key: string, val: unknown) => {
      mockSetParam(key, val);
    },
    reset: vi.fn(),
  }),
}));

describe("OpticsSim Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Canvas API
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      fillStyle: "",
      fillRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      arc: vi.fn(),
      ellipse: vi.fn(),
      createLinearGradient: () => ({ addColorStop: vi.fn() }),
      setLineDash: vi.fn(),
      fillText: vi.fn(),
      quadraticCurveTo: vi.fn(),
      closePath: vi.fn(),
    });
  });

  it("renders parameters controls correctly in parameters mode", () => {
    render(<OpticsSim mode="parameters" />);
    const sliders = screen.getAllByRole("slider");
    expect(sliders.length).toBeGreaterThan(0);
    expect(screen.getByText("physics.optics.focal_length")).toBeDefined();
  });

  it("calls setParam when focal length slider changes", () => {
    render(<OpticsSim mode="parameters" />);
    const sliders = screen.getAllByRole("slider");
    const focalSlider = sliders[0];

    fireEvent.change(focalSlider, { target: { value: "200" } });

    expect(mockSetParam).toHaveBeenCalledWith("focalLength", 200);
  });

  it("renders canvas in main mode", () => {
    render(<OpticsSim mode="main" />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeDefined();
  });
});
