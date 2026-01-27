/* eslint-disable @typescript-eslint/no-explicit-any -- Tone.js is dynamically loaded to avoid auto-context creation */
// Don't import * as Tone from 'tone'; to strictly avoid auto-context creation
// We will import it dynamically

export type SoundPreset =
  | "zen-bell"
  | "glass-ping"
  | "digital-chime"
  | "soft-gong"
  | "success-chord"
  | "future-bleep"
  | "cosmic-drop"
  | "retro-coin"
  | "warm-pulse"
  | "ethereal-swell";

export const SOUND_PRESETS: { id: SoundPreset; name: string }[] = [
  { id: "zen-bell", name: "Zen Bell" },
  { id: "glass-ping", name: "Glass Ping" },
  { id: "digital-chime", name: "Digital Chime" },
  { id: "soft-gong", name: "Soft Gong" },
  { id: "success-chord", name: "Success Chord" },
  { id: "future-bleep", name: "Future Bleep" },
  { id: "cosmic-drop", name: "Cosmic Drop" },
  { id: "retro-coin", name: "Retro Coin" },
  { id: "warm-pulse", name: "Warm Pulse" },
  { id: "ethereal-swell", name: "Ethereal Swell" },
];

class NotificationSoundService {
  private Tone: any = null; // Dynamically loaded module
  private polySynth: any = null;
  private metalSynth: any = null;
  private membraneSynth: any = null;

  private async init() {
    if (!this.Tone) {
      try {
        this.Tone = (await import("tone")) as any;
      } catch (e) {
        console.error("Failed to load Tone.js", e);
        return false;
      }
    }

    const Tone = this.Tone;

    if (Tone.context.state !== "running") {
      try {
        await Tone.start();
      } catch (e) {
        console.warn("Audio context blocked or start failed", e);
        // We don't necessarily return false here, as we might try to trigger sounds later
        // which might work if context resumes. But for now, returning false is safer
        // to avoid triggering synths on a dead context if that's the intention.
        return false;
      }
    }

    if (!this.polySynth) {
      this.polySynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "triangle" },
        envelope: { attack: 0.05, decay: 0.2, sustain: 0.2, release: 2 },
      }).toDestination();
      this.polySynth.volume.value = -10;
    }

    if (!this.metalSynth) {
      this.metalSynth = new Tone.MetalSynth({
        envelope: { attack: 0.001, decay: 1.4, release: 0.2 },
        harmonicity: 5.1,
        modulationIndex: 32,
        resonance: 4000,
        octaves: 1.5,
      }).toDestination();
      this.metalSynth.volume.value = -15;
      this.metalSynth.frequency.value = 200;
    }

    if (!this.membraneSynth) {
      this.membraneSynth = new Tone.MembraneSynth().toDestination();
      this.membraneSynth.volume.value = -10;
    }

    return true;
  }

  public async play(preset: SoundPreset) {
    const ready = await this.init();
    if (!ready) return;

    // console.log(`[Audio] Playing preset: ${preset}`);

    switch (preset) {
      case "zen-bell":
        this.metalSynth?.triggerAttackRelease("C5", "8n");
        setTimeout(
          () => this.metalSynth?.triggerAttackRelease("E5", "8n", "+0.1"),
          100,
        );
        break;

      case "glass-ping":
        this.polySynth?.set({ oscillator: { type: "sine" } });
        this.polySynth?.triggerAttackRelease(["C6", "E6"], "8n");
        break;

      case "digital-chime":
        this.polySynth?.set({
          oscillator: { type: "square" },
          envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.1 },
        });
        this.polySynth?.triggerAttackRelease(["C5", "G5", "C6"], "16n");
        break;

      case "soft-gong":
        this.metalSynth?.set({ harmonicity: 12, resonance: 800 });
        this.metalSynth?.triggerAttackRelease("G2", "1n");
        break;

      case "success-chord":
        this.polySynth?.set({ oscillator: { type: "triangle" } });
        this.polySynth?.triggerAttackRelease(["C4", "E4", "G4", "C5"], "2n");
        break;

      case "future-bleep":
        this.polySynth?.triggerAttackRelease("C6", "32n");
        setTimeout(
          () => this.polySynth?.triggerAttackRelease("G6", "32n"),
          100,
        );
        break;

      case "cosmic-drop":
        this.membraneSynth?.triggerAttackRelease("C2", "8n");
        this.polySynth?.triggerAttackRelease(["C5", "G5"], "4n", "+0.1");
        break;

      case "retro-coin":
        this.polySynth?.set({ oscillator: { type: "square" } });
        this.polySynth?.triggerAttackRelease("B5", "16n");
        setTimeout(() => this.polySynth?.triggerAttackRelease("E6", "8n"), 50);
        break;

      case "warm-pulse":
        this.polySynth?.set({
          oscillator: { type: "sine" },
          envelope: { attack: 0.5, decay: 0.5, sustain: 0.5, release: 1 },
        });
        this.polySynth?.triggerAttackRelease(["C4", "G4"], "1n");
        break;

      case "ethereal-swell":
        this.polySynth?.set({
          oscillator: { type: "fmsine" },
          envelope: { attack: 1, decay: 2, sustain: 0.5, release: 3 },
        });
        this.polySynth?.triggerAttackRelease(["A4", "C5", "E5"], "2n");
        break;
    }
  }
}

export const notificationService = new NotificationSoundService();
