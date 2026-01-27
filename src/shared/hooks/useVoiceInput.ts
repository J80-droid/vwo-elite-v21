/* eslint-disable @typescript-eslint/no-explicit-any -- Web Speech API types are browser-specific */
/**
 * Voice Input Hook
 * Provides speech-to-text functionality using Web Speech API
 */

import { useCallback, useEffect, useRef, useState } from "react";

interface UseVoiceInputOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

interface UseVoiceInputReturn {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
  isSupported: boolean;
  error: string | null;
}

// Check browser support
const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export function useVoiceInput(
  options: UseVoiceInputOptions = {},
): UseVoiceInputReturn {
  const {
    lang = "nl-NL",
    continuous = false,
    interimResults = true,
    onResult,
    onError,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const isSupported = !!SpeechRecognition;

  // Initialize recognition
  useEffect(() => {
    if (!isSupported) return;

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      let interim = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (finalTranscript) {
        setTranscript((prev) => prev + finalTranscript);
        onResult?.(finalTranscript, true);
      }

      setInterimTranscript(interim);
      if (interim) {
        onResult?.(interim, false);
      }
    };

    recognition.onerror = (event: any) => {
      let errorMessage = "Spraakherkenning mislukt";

      switch (event.error) {
        case "no-speech":
          errorMessage = "Geen spraak gedetecteerd";
          break;
        case "audio-capture":
          errorMessage = "Geen microfoon gevonden";
          break;
        case "not-allowed":
          errorMessage = "Microfoon toegang geweigerd";
          break;
        case "network":
          errorMessage = "Netwerkfout";
          break;
        case "aborted":
          // User cancelled, not an error
          return;
      }

      setError(errorMessage);
      setIsListening(false);
      onError?.(errorMessage);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, [lang, continuous, interimResults, onResult, onError, isSupported]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) return;

    setTranscript("");
    setInterimTranscript("");
    setError(null);

    try {
      recognitionRef.current.start();
    } catch (e) {
      console.error("Failed to start recognition:", e);
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListening) return;

    recognitionRef.current.stop();
  }, [isListening]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    toggleListening,
    isSupported,
    error,
  };
}
