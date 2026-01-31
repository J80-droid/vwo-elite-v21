import { aiGenerate } from "@shared/api/aiCascadeService";
import { connectLiveSession } from "@shared/api/geminiService";
import { saveCoachingSession } from "@shared/api/sqliteService";
import { useSettings } from "@shared/hooks/useSettings";
import { useVoiceCoach } from "@shared/lib/contexts/VoiceCoachContext";
import { Language } from "@shared/types";
import { CoachingSessionAnalytics } from "@shared/types/coaching";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { SOCRATIC_SYSTEM_PROMPT } from "../data/systemPrompts";

// Fix window type for WebKitAudioContext
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

export type CoachState =
  | "idle"
  | "connecting"
  | "listening"
  | "speaking"
  | "thinking";

interface UseSocraticVoiceProps {
  lang?: Language;
  onTranscript?: (text: string, isUser: boolean) => void;
}

export function useSocraticVoice({
  lang = "nl",
  onTranscript,
}: UseSocraticVoiceProps = {}) {
  const { settings } = useSettings();
  const { context, isActive, setIsActive } = useVoiceCoach();
  const [state, setState] = useState<CoachState>("idle");
  const isMounted = useRef(true);

  // Audio refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<AudioWorkletNode | null>(null);
  const liveSessionRef = useRef<{
    sendAudio: (d: Float32Array) => void;
    sendText: (t: string) => void;
    close: () => void;
  } | null>(null);
  const nextStartTimeRef = useRef(0);
  const transcriptRef = useRef("");
  const sessionStartTimeRef = useRef(0);

  // Helper to build prompt - Memoized to be safe
  const buildSystemPrompt = useCallback(() => {
    // PRIORITIZE THE SOCRATIC SYSTEM PROMPT
    let basePrompt = SOCRATIC_SYSTEM_PROMPT;

    // Add specific language instruction if needed
    basePrompt += `\n\nSpreek ${lang === "nl" ? "Nederlands" : "Engels"}.`;

    if (context?.systemPrompt) {
      // Merge View-Specific Context if available
      return `${basePrompt}\n\n[SPECIFIC CONTEXT]:\n${context.systemPrompt}\n\n${context.contextData
        ? `[DATA]: ${JSON.stringify(context.contextData)}`
        : ""
        }`;
    }

    return basePrompt;
  }, [lang, context]);

  const stopSession = useCallback(async () => {
    if (liveSessionRef.current) {
      liveSessionRef.current.close();
      liveSessionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.port.onmessage = null;
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    // SAVE SESSION LOGIC
    const transcript = transcriptRef.current;
    if (transcript.length > 50) {
      const subject = context?.viewName || "Socratic Session";
      const duration = (Date.now() - sessionStartTimeRef.current) / 1000;

      let summary = "";
      let analytics: CoachingSessionAnalytics | null = null;

      try {
        const analysisPrompt = `
          Analyze the following Socratic coaching session transcript between a student and an AI coach.
          Provide a JSON response with the following fields:
          - summary: A concise 2-3 sentence overview of the session.
          - language: The primary language used (e.g., "Nederlands", "English").
          - fragments: 2-3 essential highlights or "aha" moments.
          - terminology: Key terms or definitions discussed.
          - takeaways: 3 core bullet points for exam preparation.
          - masteryScore: Educational assessment of the student's understanding (0-100).
          - learningGaps: Specific topics where the student struggled.
          - correctionLog: Brief log of errors corrected by the coach.
          - flashcards: 3-5 Q&A pairs for study.
          - testQuestions: 3 self-test questions for tomorrow.
          - studyAdvice: Concrete next steps for the student.
          - confidenceScore: Assessment of student's vocal/logical confidence (0-100).
          - interactionRatio: user_words / total_words.
          - sentiment: Emotional tone (e.g., "enthusiast", "gefrustreerd", "kalm").
          
          VWO-Elite Expansion Fields:
          - pitfalls: 2-3 common exam pitfalls the student encountered or should avoid.
          - syllabusLinks: Connections to official VWO syllabus domains (e.g., "Domein B1").
          - examVocab: Evaluation of subject-specific terminology usage.
          - structureScore: Score (0-100) for logical structure of student's answers.
          - argumentationQuality: Analysis of reasoning (claims vs evidence).
          - criticalThinking: Assessment of multi-perspective thinking.
          - scientificNuance: Usage of nuance/precision in scientific statements.
          - sourceUsage: Mentions of relevant authors/sources/experiments.
          - bloomLevel: Highest cognitive level achieved (Onthouden -> Creëren).
          - estStudyTime: AI's estimate of remaining study time for this topic.
          - examPriority: How critical this topic is for the CE (Examen).
          - crossLinks: Interdisciplinary connections mentioned.
          - anxietyLevel: Detected level of exam stress/anxiety.
          - cognitiveLoad: Assessment of mental fatigue/saturation.
          - growthMindset: Student's response to corrections/difficulty.
          - learningStateVector: A compact JSON string representing the student's current knowledge state as a numerical vector or mapped scores (0.0-1.0) for the sub-topics discussed, useful for a mastery heatmap.

          Transcript:
          ${transcript}
        `;

        const response = await aiGenerate(
          analysisPrompt,
          { systemPrompt: "You are an educational data analyst. Respond ONLY with valid JSON." }
        );

        // Sanitize JSON response (remove markdown blocks if present)
        const jsonStr = response.replace(/```json\n?|\n?```/g, "").trim();
        const parsed = JSON.parse(jsonStr);

        summary = parsed.summary;
        analytics = parsed;
      } catch (e) {
        console.error("Deep analytics extraction failed", e);
        summary = "Session summary unavailable due to analysis error.";
      }

      await saveCoachingSession(subject, transcript, duration, summary, analytics);
    }

    if (isMounted.current) {
      setIsActive(false);
      setState("idle");
    }
    nextStartTimeRef.current = 0;
    transcriptRef.current = ""; // Reset
  }, [context?.viewName, setIsActive, setState]);

  const startSession = useCallback(async () => {
    try {
      setState("connecting");

      // Setup Output Context
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;
      const outputCtx = new AudioContextClass({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;

      console.log("[SocraticVoice] Requesting microphone...");
      // Setup Input with Noise Cancellation
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      console.log("[SocraticVoice] Microphone granted.");
      streamRef.current = stream;

      const inputCtx = new AudioContextClass({ sampleRate: 16000 });
      const source = inputCtx.createMediaStreamSource(stream);

      // Ensure contexts are running (needed for some browsers)
      if (outputCtx.state === "suspended") {
        console.log("[SocraticVoice] Resuming output context...");
        await outputCtx.resume();
      }
      if (inputCtx.state === "suspended") {
        console.log("[SocraticVoice] Resuming input context...");
        await inputCtx.resume();
      }

      try {
        console.log("[SocraticVoice] Loading audio worklet...");
        await inputCtx.audioWorklet.addModule("audio-processor.js");
        console.log("[SocraticVoice] Audio worklet loaded.");
      } catch (e) {
        console.error("Failed to load audio-processor.js", e);
        throw new Error("Audio processor kon niet worden geladen. Refresh de pagina.");
      }

      const processor = new AudioWorkletNode(inputCtx, "audio-processor");
      processorRef.current = processor;

      console.log("[SocraticVoice] Connecting to Gemini Live...");
      // Connect to Gemini Live
      const session = await connectLiveSession(
        lang,
        (audioBuffer) => {
          if (!audioContextRef.current || !isMounted.current) return;
          setState("speaking");

          const ctx = audioContextRef.current;
          const src = ctx.createBufferSource();
          src.buffer = audioBuffer;
          src.connect(ctx.destination);

          const currentTime = ctx.currentTime;
          const startTime = Math.max(currentTime, nextStartTimeRef.current);

          src.start(startTime);

          src.onended = () => {
            if (isMounted.current) setState("listening");
          };

          nextStartTimeRef.current = startTime + audioBuffer.duration;
        },
        () => {
          if (isMounted.current) stopSession();
        },
        undefined, // _onNavigate
        buildSystemPrompt(), // systemInstructionOverride
        settings.aiConfig, // Pass aiConfig with Gemini API Key
        (text, isUser) => {
          // Append to transcript ref
          const prefix = isUser ? "User: " : "Coach: ";
          transcriptRef.current += `\n${prefix}${text}`;

          if (onTranscript) onTranscript(text, isUser);
        },
      );

      if (!isMounted.current) {
        session.close();
        return;
      }

      liveSessionRef.current = session;
      sessionStartTimeRef.current = Date.now();

      // Send greeting AFTER a small delay to ensure session is fully initialized
      if (settings.aiConfig.promptConfig?.coachSpeaksFirst) {
        const greeting =
          settings.aiConfig.promptConfig.coachGreeting ||
          "Hoi, hoe gaat het? Waarmee kan ik ik jou helpen vandaag?";

        setTimeout(() => {
          if (liveSessionRef.current && isMounted.current) {
            liveSessionRef.current.sendText(greeting);
          }
        }, 500);
      }

      // Send Input Data from Worklet
      processor.port.onmessage = (e) => {
        if (!liveSessionRef.current || !isMounted.current) return;
        const audioData = e.data as Float32Array;

        // Calculate RMS (Root Mean Square) for volume
        if (!audioData) return;
        let sum = 0;
        for (let i = 0; i < audioData.length; i++) {
          const sample = audioData[i];
          if (sample !== undefined) {
            sum += sample * sample;
          }
        }
        const rms = Math.sqrt(sum / audioData.length);

        // Noise Gate
        if (rms > 0.01) {
          liveSessionRef.current.sendAudio(audioData);
        }
      };

      source.connect(processor);
      processor.connect(inputCtx.destination);

      setIsActive(true);
      setState("listening");
    } catch (e: unknown) {
      console.error("[SocraticVoice] Error:", e);
      if (isMounted.current) {
        setState("idle");
        setIsActive(false);
        toast.error(
          `Could not start voice session: ${(e as Error).message || "Unknown error"}`,
        );
      }
    }
  }, [lang, buildSystemPrompt, setIsActive, onTranscript, stopSession, settings.aiConfig]);

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      stopSession();
    };
  }, [stopSession]);

  return {
    state,
    isActive,
    getTranscript: () => transcriptRef.current,
    startSession,
    stopSession,
    context,
  };
}
