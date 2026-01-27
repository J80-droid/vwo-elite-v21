// src/components/physicslab/modules/astro/utils/astroMath.ts

// --- Constants & Configuration ---
export const G = 1.0; // Scaled Gravitational Constant for visual sim
export const C = 299792.458; // Speed of Light (km/s)
export const SIGMA = 5.670374419e-8; // Stefan-Boltzmann
export const SOLAR_LUMINOSITY = 3.828e26; // Watt
export const SOLAR_RADIUS = 6.957e8; // Meters
export const WIEN_CONSTANT = 2.897771955e-3; // m K

// HR Diagram Axis Limits
export const HR_MIN_T = 2000;
export const HR_MAX_T = 40000;
export const HR_MIN_L = 1e-4;
export const HR_MAX_L = 1e6;

// --- Types ---
export interface Vector2 {
  x: number;
  y: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface CelestialBody {
  id: string;
  mass: number;
  radius: number;
  position: Vector2;
  velocity: Vector2;
  color: string;
  trail: Vector2[];
}

export interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
  opacity: number;
  depth: number; // 0 = far, 1 = near (for parallax)
}

// --- Physics Core ---

/**
 * Calculates the force vector based on Newton's Law of Universal Gravitation
 * F = G * (m1 * m2) / r^2
 */
export const calculateGravity = (
  pos: Vector2,
  centralMass: number,
): Vector2 => {
  const distSq = pos.x * pos.x + pos.y * pos.y;
  const dist = Math.sqrt(distSq);

  if (dist < 1) return { x: 0, y: 0 }; // Prevent singularity

  const force = (G * centralMass) / distSq;

  // Return vector pointing towards center (0,0)
  return {
    x: -force * (pos.x / dist),
    y: -force * (pos.y / dist),
  };
};

/**
 * Calculates orbital velocity required for a circular orbit at a given radius
 * v = sqrt(GM / r)
 */
export const calculateOrbitalVelocity = (
  radius: number,
  centralMass: number,
): number => {
  return Math.sqrt((G * centralMass) / radius);
};

/**
 * Updates a single body's position and velocity for one time step
 */
export const updateBodyPhysics = (
  body: CelestialBody,
  centralMass: number,
  dt: number,
): CelestialBody => {
  // 1. Calculate Gravity
  const gravity = calculateGravity(body.position, centralMass);

  // 2. Update Velocity (Euler Integration)
  // a = F/m (but here gravity is acceleration field already if we ignore body mass influence on sun)
  const newVel = {
    x: body.velocity.x + gravity.x * dt,
    y: body.velocity.y + gravity.y * dt,
  };

  // 3. Update Position
  const newPos = {
    x: body.position.x + newVel.x * dt,
    y: body.position.y + newVel.y * dt,
  };

  // 4. Update Trail (Limit length for performance)
  let newTrail = body.trail;
  // Add point every 5 frames or based on distance to save memory?
  // For smoothness, every frame is fine but limit array size.
  newTrail = [...body.trail, newPos];
  if (newTrail.length > 150) newTrail.shift(); // Keep last 150 points

  return {
    ...body,
    position: newPos,
    velocity: newVel,
    trail: newTrail,
  };
};

// --- Star Field Generation ---

export const generateStarField = (
  count: number,
  width: number,
  height: number,
): Star[] => {
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    const depth = Math.random(); // 0 to 1
    stars.push({
      x: (Math.random() - 0.5) * width,
      y: (Math.random() - 0.5) * height,
      z: (Math.random() - 0.5) * 1000, // 3D depth
      size: 0.5 + Math.random() * 1.5,
      opacity: 0.3 + Math.random() * 0.7,
      depth: depth,
    });
  }
  return stars;
};

// --- Astrophysics Helpers ---

/**
 * Calculates Relative Radius based on Temperature and Luminosity
 * L = 4 * pi * R^2 * sigma * T^4
 * R ~ sqrt(L) / T^2
 */
export const calculateStarRadiusRelative = (
  logLuminosity: number,
  tempKelvin: number,
): number => {
  const L_relative = Math.pow(10, logLuminosity);
  const T_sun = 5778;
  const T_relative = tempKelvin / T_sun;

  // R_rel = sqrt(L_rel) / (T_rel)^2
  return Math.sqrt(L_relative) / Math.pow(T_relative, 2);
};

export const kelvinToColor = (k: number): string => {
  if (k < 3000) return "#ff3300"; // M
  if (k < 4500) return "#ff8800"; // K
  if (k < 6000) return "#ffcc00"; // G
  if (k < 7500) return "#ffffcc"; // F
  if (k < 10000) return "#ffffff"; // A
  if (k < 20000) return "#ccffff"; // B
  return "#88ccff"; // O
};

export const planckLaw = (wavelengthNm: number, tempK: number): number => {
  const lam = wavelengthNm * 1e-9;
  const h = 6.626e-34;
  const c = 3.0e8;
  const k = 1.38e-23;

  const p1 = (2 * h * c * c) / Math.pow(lam, 5);
  const p2 = 1 / (Math.exp((h * c) / (lam * k * tempK)) - 1);
  return p1 * p2;
};

// --- Orbital Mechanics (Hohmann) ---

export const calculateHohmannTransfer = (
  r1: number,
  r2: number,
  mu: number,
) => {
  // Vis-viva equations for Delta-V
  // mu = G * M
  const gravParam = G * mu;

  const term1 = Math.sqrt(gravParam / r1);
  const term2 = Math.sqrt((2 * r2) / (r1 + r2));
  const dv1 = Math.abs(term1 * (term2 - 1));

  const term3 = Math.sqrt(gravParam / r2);
  const term4 = Math.sqrt((2 * r1) / (r1 + r2));
  const dv2 = Math.abs(term3 * (1 - term4));

  return { dv1, dv2, total: dv1 + dv2 };
};

// --- Numerical Analysis ---

export const calculateTangent = (
  points: Point[],
  index: number,
): number | null => {
  if (index <= 0 || index >= points.length - 1) return null;
  const pPrev = points[index - 1];
  const pNext = points[index + 1];
  if (!pPrev || !pNext) return null;
  // Central difference
  return (pNext.y - pPrev.y) / (pNext.x - pPrev.x);
};

export const calculateIntegral = (
  points: Point[],
  startIdx: number,
  endIdx: number,
): number => {
  let sum = 0;
  const start = Math.min(startIdx, endIdx);
  const end = Math.max(startIdx, endIdx);

  for (let i = start; i < end; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    if (!p1 || !p2) continue;

    const width = p2.x - p1.x;
    const avgHeight = (p1.y + p2.y) / 2;
    sum += width * avgHeight;
  }
  return sum;
};

// --- Canvas Drawing Helpers ---

export const drawArrow = (
  ctx: CanvasRenderingContext2D,
  from: Vector2,
  vec: Vector2,
  color: string,
  scale: number = 1.0,
) => {
  const toX = from.x + vec.x * scale;
  const toY = from.y + vec.y * scale;
  const headLen = 10;
  const angle = Math.atan2(toY - from.y, toX - from.x);

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;

  // Line
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(toX, toY);
  ctx.stroke();

  // Arrowhead
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - headLen * Math.cos(angle - Math.PI / 6),
    toY - headLen * Math.sin(angle - Math.PI / 6),
  );
  ctx.lineTo(
    toX - headLen * Math.cos(angle + Math.PI / 6),
    toY - headLen * Math.sin(angle + Math.PI / 6),
  );
  ctx.lineTo(toX, toY);
  ctx.fill();

  ctx.restore();
};
