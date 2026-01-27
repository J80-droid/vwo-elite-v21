import { MathModuleConfig } from "@features/math/types";
import { GraduationCap } from "lucide-react";
// import { TutorStage } from './TutorStage'; // Converted to dynamic stage loading

export const tutorConfig: MathModuleConfig = {
  id: "tutor",
  label: (_t) => "The Tutor",
  icon: GraduationCap,
  description: "Socratische AI & Bewijsvoering",
  color: "violet",
  borderColor: "border-violet-500",
};
