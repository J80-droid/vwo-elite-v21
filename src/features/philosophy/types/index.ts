/* eslint-disable @typescript-eslint/no-explicit-any */
import { LucideIcon } from "lucide-react";
import React from "react";

export interface PhilosophyModule {
  id: string;
  label: (t: any) => string;
  icon: LucideIcon;
  description: string | ((t: any) => string);
  color: string;
  borderColor: string;
  // Layout Components
  StageComponent?: React.FC<any>;
  SidebarComponent?: React.FC<any>;
  sidebarWidth?: string; // Optional override for md:w-80 (e.g., md:w-72)
  component?: React.FC<any>; // Legacy fallback
}

export type PhilosophyModuleConfig = PhilosophyModule;

export interface PhilosophyGlobalSettings {
  theme: "dark" | "light";
  showTooltips: boolean;
}

export const defaultPhilosophyGlobalSettings: PhilosophyGlobalSettings = {
  theme: "dark",
  showTooltips: true,
};

// Module specific states

export interface DialogueState {
  chatHistory: { role: "user" | "assistant" | "system"; content: string }[];
  currentTopic: string | null;
  philosopherPersona: string;
  isTyping: boolean;
}

export const defaultDialogueState: DialogueState = {
  chatHistory: [],
  currentTopic: null,
  philosopherPersona: "Socrates",
  isTyping: false,
};

// ... placeholders for others
