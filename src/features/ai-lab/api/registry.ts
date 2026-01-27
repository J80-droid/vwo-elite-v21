import { AILabModule } from "@features/ai-lab/types";
import { Cpu, Sparkles,Workflow } from "lucide-react";

export const AI_LAB_MODULES: AILabModule[] = [
  {
    id: "prompt-eng",
    label: "Neural Forge",
    description: "Advanced Prompt Engineering Workbench",
    icon: Cpu,
    color: "text-purple-400",
  },
  {
    id: "architecture",
    label: "Neural Architect",
    description: "Agent & Workflow Orchestration",
    icon: Workflow,
    color: "text-cyan-400",
  },
  {
    id: "dashboard",
    label: "Neural Dashboard",
    description: "Live visualisatie van de 14 intelligentie pijlers.",
    icon: Sparkles,
    color: "text-electric",
  },
];

export const getAILabModule = (id: string): AILabModule | undefined => {
  return AI_LAB_MODULES.find((m) => m.id === id);
};
