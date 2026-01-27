import { ExamModuleConfig } from "@features/exam/types";
import { Activity, Brain, FileCheck } from "lucide-react";

const modules: Record<string, ExamModuleConfig> = {
  simulator: {
    id: "simulator",
    label: () => "Simulator",
    icon: Activity,
    color: "text-blue-400",
    borderColor: "border-blue-500",
    description: "Real-time examen simulatie",
  },
  trainer: {
    id: "trainer",
    label: () => "Trainer",
    icon: Brain,
    color: "text-purple-400",
    borderColor: "border-purple-500",
    description: "Train je kennis met AI",
  },
  quiz: {
    id: "quiz",
    label: () => "Oefenen",
    icon: Activity,
    color: "text-amber-400",
    borderColor: "border-amber-500",
    description: "Oefen specifieke onderwerpen",
  },
  results: {
    id: "results",
    label: () => "Resultaten",
    icon: FileCheck,
    color: "text-emerald-400",
    borderColor: "border-emerald-500",
    description: "Bekijk je voortgang",
  },
};

export const getAllModules = (): ExamModuleConfig[] => {
  // Use the correct IDs: simulator, trainer, quiz, results
  const order = ["simulator", "trainer", "quiz", "results"];
  return order.map((id) => modules[id]).filter(Boolean) as ExamModuleConfig[];
};
