import { useEffect, useRef } from "react";

import { useAstroEngine } from "./useAstroEngine";

export const useAstroAudio = () => {
  const { isPlaying, centralMass, zoom } = useAstroEngine();
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);

  // Initialize Audio
  useEffect(() => {
    const initAudio = () => {
      if (audioContextRef.current) return;

      const AudioContextClass =
        window.AudioContext ||
        (
          window as unknown as Window & {
            webkitAudioContext: typeof AudioContext;
          }
        ).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      // Drone Oscillator (Deep Sine/Triangle)
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(55, ctx.currentTime); // A1 (Low Drone)

      // Lowpass Filter (Muffled space sound)
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(200, ctx.currentTime);
      filter.Q.value = 1;

      // Gain (Volume)
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, ctx.currentTime); // Start silent

      // Connect: Osc -> Filter -> Gain -> Out
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start();

      oscRef.current = osc;
      filterRef.current = filter;
      gainRef.current = gain;
    };

    // Initialize on first user interaction is best practice,
    // but for now we init on mount if allowed, or we can lazy load.
    // Let's lazy load on "Play" if needed, but here we assume user has interacted.
    // We'll just init.
    // Note: Browsers block audio until interaction.
    const handleInteract = () => {
      initAudio();
      if (audioContextRef.current?.state === "suspended") {
        audioContextRef.current.resume();
      }
      window.removeEventListener("click", handleInteract);
      window.removeEventListener("touchstart", handleInteract);
      window.removeEventListener("keydown", handleInteract);
    };

    window.addEventListener("click", handleInteract);
    window.addEventListener("touchstart", handleInteract);
    window.addEventListener("keydown", handleInteract);

    return () => {
      window.removeEventListener("click", handleInteract);
      window.removeEventListener("touchstart", handleInteract);
      window.removeEventListener("keydown", handleInteract);
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Modulate Sound based on Simulation State
  useEffect(() => {
    if (
      !audioContextRef.current ||
      !oscRef.current ||
      !filterRef.current ||
      !gainRef.current
    )
      return;

    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    if (isPlaying) {
      // Volume Fade In
      gainRef.current.gain.setTargetAtTime(0.05, now, 0.5); // Very subtle background drone

      // Modulate Pitch based on Mass (Heavier = Lower Rumble)
      // Mass: 1000 - 100,000
      // Freq: 110Hz -> 30Hz
      const baseFreq = 110 - (centralMass / 100000) * 80;
      oscRef.current.frequency.setTargetAtTime(baseFreq, now, 0.2);

      // Modulate Filter based on Zoom (Closer = Brighter/More Intense)
      // Zoom: 0.1 -> 5.0
      // Cutoff: 100Hz -> 800Hz
      const cutoff = 100 + zoom * 200;
      filterRef.current.frequency.setTargetAtTime(cutoff, now, 0.2);
    } else {
      // Fade Out when paused
      gainRef.current.gain.setTargetAtTime(0, now, 0.5);
    }
  }, [isPlaying, centralMass, zoom]);

  return null; // This hook manages side effects, returns nothing (or controls)
};
