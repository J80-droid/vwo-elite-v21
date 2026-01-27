// src/components/physicslab/modules/astro/utils/astroMath.ts

// Constanten
export const SIGMA = 5.670374419e-8; // Stefan-Boltzmann
export const SOLAR_LUMINOSITY = 3.828e26; // Watt
export const SOLAR_RADIUS = 6.957e8; // meter
export const WIEN_CONSTANT = 2.897771955e-3; // m K

// Kleurtemperatuur benadering (Kelvin naar Hex)
// Dit is een vereenvoudigde mapping voor visualisatie
export const kelvinToColor = (k: number): string => {
  if (k < 3000) return "#ff3300"; // Rood (M)
  if (k < 4500) return "#ff8800"; // Oranje (K)
  if (k < 6000) return "#ffcc00"; // Geel (G - Zon)
  if (k < 7500) return "#ffffcc"; // Wit-Geel (F)
  if (k < 10000) return "#ffffff"; // Wit (A)
  if (k < 20000) return "#ccffff"; // Blauw-Wit (B)
  return "#88ccff"; // Diep Blauw (O)
};

// Bereken Luminositeit (in Solar Units) op basis van T en R (in Solar Units)
// L ~ R^2 * T^4
export const calculateLuminosity = (
  tKelvin: number,
  rSolar: number,
): number => {
  const tSolar = 5778;
  return Math.pow(rSolar, 2) * Math.pow(tKelvin / tSolar, 4);
};

// Planck kromme intensiteit voor grafiek
export const planckLaw = (wavelengthNm: number, tempK: number): number => {
  const lam = wavelengthNm * 1e-9;
  const h = 6.626e-34;
  const c = 3.0e8;
  const k = 1.38e-23;

  const p1 = (2 * h * c * c) / Math.pow(lam, 5);
  const p2 = 1 / (Math.exp((h * c) / (lam * k * tempK)) - 1);
  return -p1 * p2; // Negatief voor graph viz? Actually intensity is positive.
  // The previous implementation used positive.
  return p1 * p2;
};
