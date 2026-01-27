import { useCallback, useEffect, useRef } from "react";
import * as Tone from "tone";

export const useGymSound = () => {
  // Synths refs to avoid recreation
  const correctSynth = useRef<Tone.PolySynth<Tone.FMSynth> | null>(null);
  const wrongSynth = useRef<Tone.MembraneSynth | null>(null);
  const levelUpSynth = useRef<Tone.PolySynth<Tone.DuoSynth> | null>(null);
  const isInitialized = useRef(false);

  const initAudio = useCallback(async () => {
    if (isInitialized.current) return;
    await Tone.start();

    // Correct: Crunchy "Glass Click" (High + Low Layer for satisfaction)
    correctSynth.current = new Tone.PolySynth(Tone.FMSynth, {
      oscillator: { type: "sine" },
      envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 },
      modulation: { type: "square" },
      modulationIndex: 10,
    }).toDestination();
    correctSynth.current.volume.value = -8;

    // Wrong: Low, heavy thud (Error)
    wrongSynth.current = new Tone.MembraneSynth({
      pitchDecay: 0.1,
      octaves: 4,
      oscillator: { type: "triangle" },
      envelope: { attack: 0.01, decay: 0.4, sustain: 0.01, release: 1.4 },
    }).toDestination();
    wrongSynth.current.volume.value = -6;

    // Level Up: Euphoric shimmer
    levelUpSynth.current = new Tone.PolySynth(Tone.DuoSynth, {
      voice0: { oscillator: { type: "sawtooth" } },
      voice1: { oscillator: { type: "sine" } },
      harmonicity: 1.5,
      vibratoAmount: 0.2,
    }).toDestination();
    levelUpSynth.current.volume.value = -10;

    isInitialized.current = true;
  }, []);

  const ensureAudioContext = useCallback(async () => {
    if (!isInitialized.current || Tone.context.state !== "running") {
      await Tone.start();
      if (!isInitialized.current) initAudio();
    }
  }, [initAudio]);

  const playCorrect = useCallback(async () => {
    await ensureAudioContext();
    // Crunchy chord
    correctSynth.current?.triggerAttackRelease(["C6", "E6"], "32n");
  }, [ensureAudioContext]);

  const playWrong = useCallback(async () => {
    await ensureAudioContext();
    wrongSynth.current?.triggerAttackRelease("A1", "8n");
  }, [ensureAudioContext]);

  const playLevelUp = useCallback(async () => {
    await ensureAudioContext();
    const now = Tone.now();
    // Euphoric major sweep
    levelUpSynth.current?.triggerAttackRelease(
      ["C4", "E4", "G4", "C5", "E5", "G5"],
      "16n",
      now + 0.05,
    );
    levelUpSynth.current?.triggerAttackRelease(
      ["C5", "E5", "G5", "C6"],
      "4n",
      now + 0.2,
    );
  }, [ensureAudioContext]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      correctSynth.current?.dispose();
      wrongSynth.current?.dispose();
      levelUpSynth.current?.dispose();
      isInitialized.current = false;
    };
  }, []);

  return { playCorrect, playWrong, playLevelUp };
};
