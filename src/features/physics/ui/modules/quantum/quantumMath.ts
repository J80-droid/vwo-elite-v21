/**
 * Factorial helper with memoization for small n
 */
const factorialCache: number[] = [1, 1];
export const factorial = (n: number): number => {
  if (n < 0) return NaN;
  if (n < factorialCache.length) {
    return factorialCache[n] ?? 1;
  }

  let result = factorialCache[factorialCache.length - 1] ?? 1;
  for (let i = factorialCache.length; i <= n; i++) {
    result *= i;
    factorialCache[i] = result;
  }
  return result;
};

/**
 * Optimized Hermite Polynomial H_n(x).
 * Includes Fast-Path for small n (0-8) to avoid loop overhead in render cycles.
 */
export const hermite = (n: number, x: number): number => {
  // Fast-path for UI-limited quantum states (Elite Performance Optimization)
  switch (n) {
    case 0:
      return 1;
    case 1:
      return 2 * x;
    case 2:
      return 4 * x * x - 2;
    case 3:
      return 8 * x * x * x - 12 * x;
    case 4:
      return 16 * x * x * x * x - 48 * x * x + 12;
    case 5:
      return 32 * Math.pow(x, 5) - 160 * Math.pow(x, 3) + 120 * x;
    case 6:
      return 64 * Math.pow(x, 6) - 480 * Math.pow(x, 4) + 720 * x * x - 120;
    case 7:
      return (
        128 * Math.pow(x, 7) -
        1344 * Math.pow(x, 5) +
        3360 * Math.pow(x, 3) -
        1680 * x
      );
    case 8:
      return (
        256 * Math.pow(x, 8) -
        3584 * Math.pow(x, 6) +
        13440 * Math.pow(x, 4) -
        13440 * x * x +
        1680
      );
    default: {
      // Fallback for n > 8 (Generic Recursive)
      let h_prev = 1; // H_0
      let h_curr = 2 * x; // H_1
      for (let i = 1; i < n; i++) {
        const next = 2 * x * h_curr - 2 * i * h_prev;
        h_prev = h_curr;
        h_curr = next;
      }
      return h_curr;
    }
  }
};

// -- Caching mechanism for time-independent constants -- //
// Key: "n-mass-L"
// Value: Pre-calculated normalization (N) and alpha
interface CachedConstants {
  N: number; // Normalization constant
  alpha: number; // Scaling factor
  sqrtAlpha: number; // Pre-calculated sqrt(alpha) for xi
}
const waveConstantsCache = new Map<string, CachedConstants>();

/**
 * Harmonic Oscillator Wavefunction psi_n(x) with Caching.
 * * Performance Note:
 * Calculations dependent on n, mass, and L are cached.
 * Only the spatial mapping (xi) and polynomial evaluation run per-pixel.
 */
export const harmonicWavefunction = (
  n: number,
  x: number,
  mass: number,
  L: number,
): number => {
  // Generate Cache Key
  // Floating points truncated to 4 decimals to ensure cache hits on subtle float variations if necessary,
  // though usually L and mass come from stable React state.
  const key = `${n}-${mass.toFixed(4)}-${L.toFixed(4)}`;

  let constants = waveConstantsCache.get(key);

  if (!constants) {
    // --- Heavy Calculation (Run Once per State Config) ---

    // Omega ~ 4.0 / L (Heuristic)
    const omega = 4.0 / L;
    const hbar = 1;

    // Alpha = m * w / hbar
    const alpha = (mass * omega) / hbar;

    // Normalization Constant N
    // N = (alpha / pi)^(1/4) * (1 / sqrt(2^n * n!))
    const N =
      Math.pow(alpha / Math.PI, 0.25) /
      Math.sqrt(Math.pow(2, n) * factorial(n));

    constants = {
      N,
      alpha,
      sqrtAlpha: Math.sqrt(alpha),
    };

    // Limit cache size to prevent memory leaks in long sessions
    if (waveConstantsCache.size > 100) {
      waveConstantsCache.clear();
    }

    waveConstantsCache.set(key, constants);
  }

  // --- Per-Pixel Calculation (Optimized) ---
  // xi = sqrt(alpha) * x
  const xi = constants.sqrtAlpha * x;

  // psi = N * H_n(xi) * exp(-xi^2 / 2)
  return constants.N * hermite(n, xi) * Math.exp(-(xi * xi) * 0.5);
};

// Simple cache for energy levels (though extremely cheap to calc)
const energyCache = new Map<string, number>();

export const harmonicEnergy = (n: number, _mass: number, L: number): number => {
  const key = `${n}-${L.toFixed(4)}`; // Energy independent of mass in this specific heuristic model (omega depends on L)

  if (energyCache.has(key)) return energyCache.get(key)!;

  const omega = 4.0 / L;
  const E = omega * (n + 0.5);

  if (energyCache.size > 100) energyCache.clear();
  energyCache.set(key, E);

  return E;
};

// --- NIEUW: Helpers voor Expectation Value en Spectra ---

/**
 * Numerieke integratie om de verwachtingswaarde <x> te berekenen.
 * <x> = Integral( Psi*(x) * x * Psi(x) dx )
 */
export const calculateExpectationValue = (
  points: { x: number; y: number; prob: number }[],
): number => {
  // Riemann som benadering
  let expectation = 0;
  let totalProb = 0;

  for (const p of points) {
    // p.prob is al |Psi|^2
    expectation += p.x * p.prob;
    totalProb += p.prob;
  }

  // Normalisatie correctie (voor de zekerheid, hoewel golf al genormaliseerd zou moeten zijn)
  return totalProb > 0 ? expectation / totalProb : 0;
};

/**
 * Vertaalt Energieverschil (in sim-units) naar zichtbare kleur en golflengte (nm).
 * Dit is een heuristieke mapping voor educatieve visualisatie (Bohr model).
 */
export const energyToSpectralColor = (
  deltaE: number,
): { color: string; wavelength: number; label: string } => {
  const absE = Math.abs(deltaE);

  // Simpele mapping: Stel n=2 -> n=1 is Rood (650nm), n=3 -> n=1 is Blauw (450nm)
  // In harmonische oscillator is Delta E constant (hbar*omega), dus saaier.
  // In oneindige put groeit Delta E kwadratisch.

  // Arbitraire scaling factor om sim-units naar nm te brengen
  let wavelength = 0;

  if (absE === 0) return { color: "transparent", wavelength: 0, label: "" };

  // E = hc / lambda  => lambda = C / E
  wavelength = Math.round(1240 / (absE * 2)); // *2 is 'fudge factor' voor mooie waarden

  // Clamp voor zichtbaar spectrum (ongeveer 380 - 750)
  let color = "#ffffff";
  let label = "Visible";

  if (wavelength > 750) {
    color = "#ef4444";
    label = "IR";
  } // Infrarood (Rood weergeven)
  else if (wavelength < 380) {
    color = "#8b5cf6";
    label = "UV";
  } // UV (Paars weergeven)
  else {
    // Eenvoudige HSL mapping van 380(violet) naar 750(rood)
    // 380nm -> 270hue, 750nm -> 0hue
    const ratio = (wavelength - 380) / (750 - 380);
    const hue = 270 - ratio * 270;
    color = `hsl(${hue}, 100%, 50%)`;
  }

  return { color, wavelength, label };
};

/**
 * Calculates the wavefunction for a potential barrier/step.
 * Returns the complex value { re, im } at position x.
 *
 * E: Particle Total Energy
 * V0: Barrier Potential Height
 * a: Barrier Width
 * m: Mass
 */
export const barrierWavefunction = (
  x: number,
  E: number,
  V0: number,
  a: number,
  m: number,
): { re: number; im: number } => {
  // Constants (Simplified for simulation visual scale)
  const hbar = 1;

  // Region boundaries (Barrier is centered at 0)
  const x1 = -a / 2;
  const x2 = a / 2;

  // k1 = sqrt(2mE) / hbar (Wave number outside barrier)
  const k1 = Math.sqrt(2 * m * E) / hbar;

  if (x < x1) {
    // Region 1: x < -a/2 (Incident + Reflected)
    // Psi = exp(ik1x) + R * exp(-ik1x)
    // For visualization simplicity, we trace the 'Incident' wave mostly,
    // or a standing wave if E < V0. Let's show a traveling wave -> right.
    return {
      re: Math.cos(k1 * x),
      im: Math.sin(k1 * x),
    };
  } else if (x > x2) {
    // Region 3: x > a/2 (Transmitted)
    // Psi = T * exp(ik1x)

    // Calculate Transmission Coefficient T norm
    let T_mag = 0;

    if (E > V0) {
      // Scattering
      // T approx 1 for simple viz when E >> V0
      T_mag = 1.0;
    } else {
      // Tunneling
      const kappa = Math.sqrt(2 * m * (V0 - E)) / hbar;
      // T ~ exp(-2*kappa*a) (approx for wide barrier)
      T_mag = Math.exp(-kappa * a);
    }

    return {
      re: T_mag * Math.cos(k1 * x), // Phase shift neglected for simple viz
      im: T_mag * Math.sin(k1 * x),
    };
  } else {
    // Region 2: -a/2 <= x <= a/2 (Inside Barrier)
    if (E < V0) {
      // Tunneling: Exponential Decay
      const kappa = Math.sqrt(2 * m * (V0 - E)) / hbar;
      // Psi ~ exp(-kappa * (x - x1)) * Phase(at x1)

      // Phase at boundary x1
      const phaseAtX1 = k1 * x1;
      const valAtX1 = { re: Math.cos(phaseAtX1), im: Math.sin(phaseAtX1) }; // Assuming Incident dominates boundary

      const decay = Math.exp(-kappa * (x - x1));

      return {
        re: valAtX1.re * decay,
        im: valAtX1.im * decay,
      };
    } else {
      // Scattering: Oscillating slower
      const k2 = Math.sqrt(2 * m * (E - V0)) / hbar;
      const phaseAtX1 = k1 * x1;
      const deltaX = x - x1;

      return {
        re: Math.cos(phaseAtX1 + k2 * deltaX),
        im: Math.sin(phaseAtX1 + k2 * deltaX),
      };
    }
  }
};
