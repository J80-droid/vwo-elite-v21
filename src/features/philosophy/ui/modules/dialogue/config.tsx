/* eslint-disable @typescript-eslint/no-explicit-any */
import { PhilosophyModuleConfig } from "@features/philosophy/types";
import { MessageCircle } from "lucide-react";

export const dialogueConfig: PhilosophyModuleConfig = {
  id: "dialogue",
  label: (t: any) => t("philosophy.dialogue.title", "Socratische Dialoog"),
  icon: MessageCircle,
  description: "Socratische Gespreksvoering",
  color: "violet",
  borderColor: "border-violet-500",
  sidebarWidth: "w-full md:w-64",
};
