export interface PHSolution {
  name: string;
  pkz: number;
  kz: number;
  isWeak: boolean;
}

export interface TitrationPoint {
  volume: number;
  ph: number;
}

export const generateTitrationData = (
  acid: PHSolution,
  acidConc: number,
  acidVol: number,
  step: number = 0.1,
): TitrationPoint[] => {
  const data: TitrationPoint[] = [];
  const baseConc = 0.1; // Assumed standard molarity for the base (NaOH)
  const vEq = (acidConc * acidVol) / baseConc;

  for (let v = 0; v <= 100; v += step) {
    let ph = 7;
    const totalVol = acidVol + v;

    if (v === 0) {
      // Initial pH
      if (acid.isWeak) {
        ph = 0.5 * (acid.pkz - Math.log10(acidConc));
      } else {
        ph = -Math.log10(acidConc);
      }
    } else if (v < vEq) {
      // Pre-equivalence
      if (acid.isWeak) {
        // Buffer region: Henderson-Hasselbalch
        // pH = pKa + log(salt/acid)
        // salt ~ v, acid ~ vEq - v
        if (vEq - v < 0.0001) {
          // Close to Eq
          ph = acid.pkz + 1; // Simplified approach for very close
        } else {
          ph = acid.pkz + Math.log10(v / (vEq - v));
        }
      } else {
        // Excess Strong Acid
        const molesH = acidConc * acidVol - baseConc * v;
        const concH = molesH / totalVol;
        ph = -Math.log10(concH > 0 ? concH : 1e-14);
      }
    } else if (Math.abs(v - vEq) < 0.1) {
      // Equivalence Point
      if (acid.isWeak) {
        // Hydrolysis of conjugate base
        const molesBase = baseConc * vEq; // = moles acid initial
        const concBase = molesBase / (acidVol + vEq);
        const pKb = 14 - acid.pkz;
        const pOH = 0.5 * (pKb - Math.log10(concBase));
        ph = 14 - pOH;
      } else {
        ph = 7.0;
      }
    } else {
      // Excess Base
      const molesOH = baseConc * v - acidConc * acidVol;
      const concOH = molesOH / totalVol;
      const pOH = -Math.log10(concOH > 0 ? concOH : 1e-14);
      ph = 14 - pOH;
    }

    // Clamp pH
    ph = Math.max(0, Math.min(14, ph));

    data.push({ volume: v, ph });
  }

  return data;
};

export const generateEnergyPath = (deltaH: number, ea: number) => {
  const points = [];
  const steps = 100;

  // Config
  const reactantEnd = 20;
  const productStart = 80;
  const peakX = 50;

  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * 100;
    let y = 0;

    if (x <= reactantEnd) {
      y = 0;
    } else if (x >= productStart) {
      y = deltaH;
    } else {
      // Activation Complex (Gaussian-ish)
      if (x < 50) {
        // Smooth Step from 20 to 50
        const t = (x - reactantEnd) / (peakX - reactantEnd); // 0 to 1
        const smooth = t * t * (3 - 2 * t);
        y = smooth * ea;
      } else {
        // Smooth Step from 50 to 80
        const t = (x - peakX) / (productStart - peakX); // 0 to 1
        const smooth = t * t * (3 - 2 * t);
        y = ea + smooth * (deltaH - ea);
      }
    }
    points.push({ x, y });
  }
  return points;
};
