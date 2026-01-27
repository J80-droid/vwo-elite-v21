/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect } from "react";

import { useMathLabContext } from "./useMathLabContext";

/**
 * useMathVoice - Voice Control Hook for MathLab
 *
 * Uses Web Speech API (SpeechRecognition) to map voice commands to MathLab actions.
 */
export function useMathVoice() {
  const {
    setActiveModule,
    setRawFunctions,
    setSymbolicFn,
    setAnimatingParams,
    setIsSonifying,
  } = useMathLabContext();

  const handleSpeechCommand = useCallback(
    (transcript: string) => {
      const text = transcript.toLowerCase();
      console.log("[MathVoice] Command:", text);

      // 1. Module Switching
      if (text.includes("analytics") || text.includes("analyse")) {
        setActiveModule("analytics");
      } else if (text.includes("symbolic") || text.includes("symbolisch")) {
        setActiveModule("symbolic");
      } else if (text.includes("formula") || text.includes("formule")) {
        setActiveModule("formulas");
      } else if (
        text.includes("drie d") ||
        text.includes("3d") ||
        text.includes("oppervlak")
      ) {
        setActiveModule("3d");
      }

      // 2. Plotting Commands
      if (text.includes("teken") || text.includes("plot")) {
        if (text.includes("sinus") || text.includes("sine")) {
          setRawFunctions(["sin(x)"]);
          setSymbolicFn("sin(x)");
        } else if (text.includes("cosinus") || text.includes("cosine")) {
          setRawFunctions(["cos(x)"]);
          setSymbolicFn("cos(x)");
        } else if (text.includes("kwadraat") || text.includes("squared")) {
          setRawFunctions(["x^2"]);
          setSymbolicFn("x^2");
        }
      }

      // 3. Control Commands
      if (text.includes("animeer") || text.includes("animate")) {
        setAnimatingParams((prev: Record<string, any>) => ({
          ...prev,
          a: true,
        }));
      } else if (text.includes("stop")) {
        setAnimatingParams({});
        setIsSonifying(false);
      } else if (
        text.includes("geluid") ||
        text.includes("sound") ||
        text.includes("sonify")
      ) {
        setIsSonifying(true);
      }
    },
    [
      setActiveModule,
      setRawFunctions,
      setSymbolicFn,
      setAnimatingParams,
      setIsSonifying,
    ],
  );

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "nl-NL";

    recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      handleSpeechCommand(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("[MathVoice] Error:", event.error);
    };

    // We don't start it automatically to avoid privacy issues,
    // but it's ready to be triggered or used.
    // For this demo, let's keep it inactive until a toggle is pressed.

    return () => {
      recognition.stop();
    };
  }, [handleSpeechCommand]);

  return {
    // Recognition status and controls could go here
  };
}
