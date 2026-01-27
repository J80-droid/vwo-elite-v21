export type Role = "user" | "assistant" | "system" | "data";

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  // Optioneel: Als de AI verwijst naar een specifiek onderdeel van de UI
  highlightElementId?: string;
}

export interface SimulationContext {
  moduleId: string; // bijv. 'astro', 'modeling'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  activeVariables: Record<string, any>; // bijv. { temp: 5000, radius: 1 }
  userAction?: string; // bijv. 'dragging_star', 'running_model'
  lastError?: string; // Als de simulatie crasht (ModelLab)
}

export interface TutorState {
  isOpen: boolean;
  messages: ChatMessage[];
  isThinking: boolean;
  currentContext: SimulationContext | null;
}
