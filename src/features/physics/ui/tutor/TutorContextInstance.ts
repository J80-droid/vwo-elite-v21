import { createContext } from "react";

import { SimulationContext, TutorState } from "./types";

export interface TutorContextValue extends TutorState {
  toggleTutor: () => void;
  updateContext: (ctx: Partial<SimulationContext>) => void;
  sendMessage: (text: string) => void;
  triggerIntervention: (reason: string) => void;
}

export const TutorContext = createContext<TutorContextValue | null>(null);
