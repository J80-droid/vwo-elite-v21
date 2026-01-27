import React, { useCallback, useState } from "react";

import { generateSystemPrompt } from "./prompts";
import { TutorContext } from "./TutorContextInstance";
import { ChatMessage, SimulationContext, TutorState } from "./types";
import { mockLLMCall, uuidv4 } from "./utils";

export const TutorProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<TutorState>(() => ({
    isOpen: false, // Default dicht, tenzij interventie
    messages: [
      {
        id: "init",
        role: "assistant",
        content:
          "Systemen online. Ik monitor je experimenten. Heb je hulp nodig bij de analyse?",
        timestamp: Date.now(),
      },
    ],
    isThinking: false,
    currentContext: null,
  }));

  const updateContext = useCallback((newCtx: Partial<SimulationContext>) => {
    setState((prev) => ({
      ...prev,
      currentContext: {
        ...prev.currentContext,
        ...newCtx,
      } as SimulationContext,
    }));
  }, []);

  const toggleTutor = () => setState((s) => ({ ...s, isOpen: !s.isOpen }));

  const sendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: uuidv4(),
      role: "user",
      content: text,
      timestamp: Date.now(),
    };

    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, userMsg],
      isThinking: true,
    }));

    try {
      // Bouw de prompt met de LAATSTE context
      const systemPrompt = generateSystemPrompt(state.currentContext);
      const history = state.messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const responseText = await mockLLMCall(
        [...history, { role: "user", content: text }],
        systemPrompt,
      );

      const aiMsg: ChatMessage = {
        id: uuidv4(),
        role: "assistant",
        content: responseText,
        timestamp: Date.now(),
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, aiMsg],
        isThinking: false,
      }));
    } catch {
      setState((prev) => ({ ...prev, isThinking: false }));
    }
  };

  // Pro-actieve interventie (bijv. bij Unit Check error in ModelLab)
  const triggerIntervention = useCallback((_reason: string) => {
    setState((prev) => {
      if (prev.isOpen) return prev; // Al open, doe niets
      return { ...prev, isOpen: true };
    });
    // Hier zou je direct een AI-bericht kunnen triggeren op basis van de 'reason'
  }, []);

  return (
    <TutorContext.Provider
      value={{
        ...state,
        toggleTutor,
        updateContext,
        sendMessage,
        triggerIntervention,
      }}
    >
      {children}
    </TutorContext.Provider>
  );
};
