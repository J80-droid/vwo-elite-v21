import { useEffect, useRef, useState } from "react";

import { WavesState } from "./useWavesEngine";

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

export const useWaveSonification = (state: WavesState) => {
  const [isMuted, setIsMuted] = useState(true);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Nodes
  const osc1Ref = useRef<OscillatorNode | null>(null);
  const gain1Ref = useRef<GainNode | null>(null);
  const osc2Ref = useRef<OscillatorNode | null>(null);
  const gain2Ref = useRef<GainNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);

  const MULTIPLIER = 200;

  // Extract relevant props to prevent re-running effect on every 'time' update
  const w1Active = state.wave1?.active;
  const w1Freq = state.wave1?.f;
  const w2Active = state.wave2?.active;
  const w2Freq = state.wave2?.f;
  const harmonicsEnabled = state.harmonics?.isEnabled;

  const initAudio = () => {
    if (!audioContextRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContext();
      const ctx = audioContextRef.current;

      masterGainRef.current = ctx.createGain();
      masterGainRef.current.gain.value = 0.3;
      masterGainRef.current.connect(ctx.destination);

      // Osc 1 Setup
      osc1Ref.current = ctx.createOscillator();
      gain1Ref.current = ctx.createGain();
      osc1Ref.current.type = "triangle";
      gain1Ref.current.gain.value = 0;
      osc1Ref.current.connect(gain1Ref.current);
      gain1Ref.current.connect(masterGainRef.current);
      osc1Ref.current.start();

      // Osc 2 Setup
      osc2Ref.current = ctx.createOscillator();
      gain2Ref.current = ctx.createGain();
      osc2Ref.current.type = "triangle";
      gain2Ref.current.gain.value = 0;
      osc2Ref.current.connect(gain2Ref.current);
      gain2Ref.current.connect(masterGainRef.current);
      osc2Ref.current.start();
    } else if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }
  };

  const toggleMute = () => {
    if (isMuted) initAudio();
    setIsMuted(!isMuted);
  };

  // Effect: Update Audio Parameters ONLY when parameters change (not time)
  useEffect(() => {
    if (!audioContextRef.current || isMuted) {
      // Silence if muted
      const t = audioContextRef.current?.currentTime || 0;
      if (gain1Ref.current) gain1Ref.current.gain.setTargetAtTime(0, t, 0.1);
      if (gain2Ref.current) gain2Ref.current.gain.setTargetAtTime(0, t, 0.1);
      return;
    }

    const ctx = audioContextRef.current;
    if (ctx.state === "suspended") ctx.resume();
    const t = ctx.currentTime;

    // Wave 1 Logic
    if (w1Active) {
      const f = Math.max(0, (w1Freq || 0) * MULTIPLIER);
      osc1Ref.current?.frequency.setTargetAtTime(f, t, 0.1);
      gain1Ref.current?.gain.setTargetAtTime(0.3, t, 0.1);
    } else {
      gain1Ref.current?.gain.setTargetAtTime(0, t, 0.1);
    }

    // Wave 2 Logic
    if (w2Active) {
      const f = Math.max(0, (w2Freq || 0) * MULTIPLIER);
      osc2Ref.current?.frequency.setTargetAtTime(f, t, 0.1);
      gain2Ref.current?.gain.setTargetAtTime(0.3, t, 0.1);
    } else {
      gain2Ref.current?.gain.setTargetAtTime(0, t, 0.1);
    }
  }, [isMuted, w1Active, w1Freq, w2Active, w2Freq, harmonicsEnabled]); // <--- Dependency Array Optimized

  useEffect(() => {
    return () => {
      osc1Ref.current?.stop();
      osc2Ref.current?.stop();
      audioContextRef.current?.close();
    };
  }, []);

  return { isMuted, toggleMute };
};
