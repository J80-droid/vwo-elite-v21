import {
  Chronotype,
  CHRONOTYPE_PEAK_HOURS,
} from "@entities/planner/model/task";
import { createStore } from "@shared/lib/storeFactory";

/**
 * BioRhythm Store - Dynamically calculates mental resources
 * based on time of day and user chronotype.
 */

interface BioRhythmState {
  energyLevel: number; // 0-100
  focusScore: number; // 0-100
  lastUpdate: string;

  // Actions
  updateRhythms: (chronotype: Chronotype) => void;
}

export const useBioRhythmStore = createStore<BioRhythmState>(
  (set) => ({
    energyLevel: 75,
    focusScore: 80,
    lastUpdate: new Date().toISOString(),

    updateRhythms: (chronotype) => {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      const time = hour + minute / 60;

      const peak =
        CHRONOTYPE_PEAK_HOURS[chronotype] || CHRONOTYPE_PEAK_HOURS.neutral;

      // 1. Calculate Base Energy (Bell curve around peak center)
      const peakCenter = (peak.start + peak.end) / 2;
      const peakWidth = peak.end - peak.start || 4;

      // Gaussian-like curve
      const dist = Math.abs(time - peakCenter);
      let energy =
        45 + 55 * Math.exp(-(dist * dist) / (peakWidth * peakWidth * 0.5));

      // 2. Apply "Post-Lunch Dip" (Universal physiological trough)
      // Strongest at 15:00
      if (time >= 13.5 && time <= 16.5) {
        const dipSeverity = 20;
        const dipCenter = 15;
        const dipDist = Math.abs(time - dipCenter);
        const dip = dipSeverity * Math.max(0, 1 - dipDist / 1.5);
        energy -= dip;
      }

      // 3. Wake-up / Wind-down Phase
      if (time < 7) energy = Math.min(energy, 30); // Sleepy
      if (time > 23) energy = Math.max(15, energy - 30); // Exhausted

      // 4. Calculate Focus Score
      // Focus is trailing energy but recovers faster after breaks (simulated)
      let focus = energy * 1.05;

      // Clamp values
      energy = Math.max(10, Math.min(100, energy));
      focus = Math.max(5, Math.min(100, focus));

      set({
        energyLevel: Math.round(energy),
        focusScore: Math.round(focus),
        lastUpdate: now.toISOString(),
      });
    },
  }),
  {
    name: "bio-rhythm",
    persist: false, // UI calculated state, no persistence needed
  }
);
