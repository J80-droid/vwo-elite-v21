import { describe, expect, it } from "vitest";

import {
  calculateLuminosity,
  kelvinToColor,
  planckLaw,
  WIEN_CONSTANT,
} from "../features/physics/ui/modules/astro/utils/astroMath";

describe("AstroLab Math Utilities (Domein E2)", () => {
  describe("Wien's Displacement Law", () => {
    it("should calculate peak wavelength correctly for the Sun", () => {
      const T_sun = 5778;
      const lambda_max = WIEN_CONSTANT / T_sun;
      // 2.898e-3 / 5778 ≈ 501e-9 meters
      expect(lambda_max).toBeCloseTo(5.01e-7, 9);
    });

    it("should have peak intensity at lambda_max in Planck Law", () => {
      const T = 5778;
      const lambda_max_nm = (WIEN_CONSTANT / T) * 1e9;

      // Check intensity at peak, and at +/- 50nm
      const intensity_peak = planckLaw(lambda_max_nm, T);
      const intensity_left = planckLaw(lambda_max_nm - 50, T);
      const intensity_right = planckLaw(lambda_max_nm + 50, T);

      expect(intensity_peak).toBeGreaterThan(intensity_left);
      expect(intensity_peak).toBeGreaterThan(intensity_right);
    });
  });

  describe("Stellar Scaling (Stefan-Boltzmann)", () => {
    it("should return 1 Solar Luminosity for Solar parameters", () => {
      const L = calculateLuminosity(5778, 1);
      expect(L).toBeCloseTo(1, 1);
    });

    it("should scale Luminosity with R^2", () => {
      // Double radius, same T -> L should be 4x
      const L = calculateLuminosity(5778, 2);
      expect(L).toBeCloseTo(4, 1);
    });

    it("should scale Luminosity with T^4", () => {
      // Double T, same R -> L should be 16x
      const T_sun = 5778;
      const L = calculateLuminosity(T_sun * 2, 1);
      expect(L).toBeCloseTo(16, 1);
    });
  });

  describe("Spectral Classification (Colors)", () => {
    it("should return Red for M-class stars (<3000K)", () => {
      expect(kelvinToColor(2500)).toBe("#ff3300");
    });
    it("should return Blue for O-class stars (>30000K)", () => {
      expect(kelvinToColor(35000)).toBe("#88ccff");
    });
  });
});
