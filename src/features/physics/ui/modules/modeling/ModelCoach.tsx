import { AlertTriangle, ArrowRight, Bot } from "lucide-react";
import React, { useEffect, useState } from "react";

import { SocraticErrorContext } from "./types";

// Mock hook for AI Tutor functionality (Place in hooks/useAITutor.ts later)
const useAITutor = () => {
  const [response, setResponse] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);

  const askTutor = (prompt: string) => {
    setIsThinking(true);
    setResponse(null);

    // Simulate network delay
    setTimeout(() => {
      setIsThinking(false);
      // In a real app, this would come from the LLM based on the system prompt
      // For now, we extract the "SOCRATISCHE AANPAK" part from the prompt if possible, or give a generic socratic response.
      if (prompt.includes("MISSING_DT")) {
        setResponse(
          "Als de versnelling (a) constant is, hoeveel snelheid komt er dan bij in één seconde? En hoeveel in 0,1 seconde?",
        );
      } else if (prompt.includes("DIMENSION_MISMATCH")) {
        setResponse(
          "Kun je appels bij peren optellen? Kijk eens goed naar de eenheden links en rechts van het '=' teken.",
        );
      } else if (prompt.includes("SYNTAX")) {
        setResponse(
          "Het lijkt erop dat er een typfoutje in zit. Heb je alle haakjes gesloten?",
        );
      } else {
        setResponse(
          "Ik zie iets geks in de eenheden. Kun je controleren of alle definities kloppen?",
        );
      }
    }, 1500);
  };

  return { askTutor, response, isThinking };
};

interface Props {
  context: SocraticErrorContext;
  onFix: () => void; // Focus de editor
}

export const ModelCoach: React.FC<Props> = ({ context, onFix }) => {
  const { askTutor, response, isThinking } = useAITutor();

  // Zodra de fout optreedt, sturen we de prompt automatisch naar de AI
  useEffect(() => {
    if (context.hasError && context.aiSystemPrompt) {
      // We sturen de context + system prompt onzichtbaar mee
      askTutor(context.aiSystemPrompt);
    }
  }, [context.hasError, context.aiSystemPrompt, askTutor]);

  if (!context.hasError) return null;

  return (
    <div className="mx-4 mb-4 bg-obsidian-900 border border-red-500/30 rounded-xl overflow-hidden animate-in slide-in-from-bottom-2">
      {/* Header: Het probleem (Technisch) */}
      <div className="bg-red-500/10 p-3 flex items-start gap-3 border-b border-red-500/10">
        <div className="p-2 bg-red-500/20 rounded-lg text-red-400">
          <AlertTriangle size={18} />
        </div>
        <div>
          <h4 className="text-red-400 font-bold text-sm uppercase tracking-wider">
            Model Consistentie Fout
          </h4>
          <p className="text-xs text-red-300/70 font-mono mt-1">
            Regel:{" "}
            <span className="bg-red-950/50 px-1 rounded text-red-200">
              {context.studentCodeSnippet}
            </span>
          </p>
          {context.conflictingUnits && (
            <div className="flex items-center gap-2 text-[10px] text-red-400/60 mt-1 font-mono">
              <span>{context.conflictingUnits.left}</span>
              <ArrowRight size={10} />
              <span>{context.conflictingUnits.right}</span>
            </div>
          )}
        </div>
      </div>

      {/* Body: De Oplossing (Socratisch) */}
      <div className="p-4 bg-gradient-to-br from-obsidian-900 to-obsidian-950">
        <div className="flex gap-4">
          <div className="shrink-0 mt-1">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <Bot size={16} className="text-emerald-400" />
            </div>
          </div>

          <div className="space-y-3 flex-1">
            <p className="text-sm text-slate-300 leading-relaxed italic">
              {isThinking ? (
                <span className="animate-pulse text-slate-500">
                  Analyseren van dimensies...
                </span>
              ) : (
                // Hier verschijnt de Socratische vraag van de AI
                // We remove the simulated generic response and rely on the hook logic which mimics the LLM
                response ||
                "Ik zie een probleem met de eenheden. Laten we kijken naar je modelregels."
              )}
            </p>

            <button
              onClick={onFix}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 uppercase tracking-widest"
            >
              <ArrowRight size={12} /> Ga naar code
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
