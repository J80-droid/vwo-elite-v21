/* eslint-disable @typescript-eslint/no-explicit-any */
import { Swords } from "lucide-react";

import { PhilosophyModuleConfig } from "../../../types";
export const battleConfig: PhilosophyModuleConfig = {
  id: "battle",
  label: (t: any) => t("philosophy.battle.title", "Begrippen Battle"),
  icon: Swords,
  description: "Terminology Speedrun",
  color: "rose",
  borderColor: "border-rose-500",
};
