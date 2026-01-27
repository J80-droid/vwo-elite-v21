import { Mic } from "lucide-react";

import { LanguageModuleConfig } from "../../../types";
export const presentationConfig: LanguageModuleConfig = {
    id: "presentation",
    label: (t) => t.LanguageLab?.presentation_title || "Presentation Coach",
    description: "Verbeter je presentatievaardigheden met real-time emotie-analyse.",
    icon: Mic,
    color: "text-cyan-400",
};
