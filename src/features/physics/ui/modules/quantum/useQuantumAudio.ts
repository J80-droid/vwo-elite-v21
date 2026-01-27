import { useEffect, useRef } from "react";

import { useQuantumEngine } from "./useQuantumEngine";

/**
 * Hook voor sonificatie van kwantum-events.
 * Gebruikt de Web Audio API voor real-time synthese (geen mp3's nodig).
 */
export const useQuantumAudio = (muted: boolean) => {
  const { lastCollapseTime, lastPhoton, activeStates } = useQuantumEngine();
  const audioCtxRef = useRef<AudioContext | null>(null);
  const activeOscillators = useRef<OscillatorNode[]>([]);

  // Initialiseer AudioContext lui (alleen bij interactie)
  const initAudio = () => {
    if (!audioCtxRef.current) {
      // Cross-browser support veiligstellen
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new Ctx();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const resume = async () => {
    const ctx = initAudio();
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
  };

  // 1. COLLAPSE SOUND (Geiger Click effect)
  // Wordt getriggerd wanneer een meting plaatsvindt
  useEffect(() => {
    if (muted || lastCollapseTime === 0) return;

    const ctx = initAudio();
    const t = ctx.currentTime;

    // Genereer kortstondige witte ruis
    const bufferSize = ctx.sampleRate * 0.005; // 5ms klik
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.8;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    // Bandpass filter voor het scherpe 'tik' geluid
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 2000;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.01);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(t);
  }, [lastCollapseTime, muted]);

  // 2. PHOTON EMISSION SOUND (Pure Sinus)
  // Wordt getriggerd bij energieverval
  useEffect(() => {
    if (muted || !lastPhoton) return;

    const ctx = initAudio();
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Mapping: Hogere energie = Hogere toon
    // Bereik: ~200Hz tot ~800Hz
    const baseFreq = 220;
    const freq = baseFreq + lastPhoton.energy * 60;

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, t);

    // Envelope (Ping geluid)
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.02); // Snelle attack
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5); // Lange decay

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.6);
  }, [lastPhoton, muted]);

  // 3. SUPERPOSITION CHORD (Polyphonic)
  // Wordt getriggerd wanneer de staat verandert (bijv. n toevoegen)
  useEffect(() => {
    // 1. CLEANUP: Stop vorige geluiden direct om chaos te voorkomen
    activeOscillators.current.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        /* ignore */
      }
    });
    activeOscillators.current = []; // Reset lijst

    if (muted || activeStates.length === 0) return;

    const ctx = initAudio();
    const t = ctx.currentTime;

    const masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);

    // Kortere attack/decay voor responsiever gevoel bij interactie
    masterGain.gain.setValueAtTime(0, t);
    masterGain.gain.linearRampToValueAtTime(0.15, t + 0.05);
    masterGain.gain.exponentialRampToValueAtTime(0.001, t + 2.0);

    activeStates.forEach((state) => {
      const osc = ctx.createOscillator();
      const n = state.n;
      // Harmonische reeks (A3 = 220Hz als basis)
      const freq = 220 + n * 55;

      osc.frequency.value = freq;
      osc.type = "triangle";
      osc.connect(masterGain);
      osc.start(t);
      osc.stop(t + 2.0);

      // Voeg toe aan tracking array
      activeOscillators.current.push(osc);
    });
  }, [activeStates, muted]);

  return { resume };
};
