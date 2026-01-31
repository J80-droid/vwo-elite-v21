/* eslint-disable @typescript-eslint/no-explicit-any -- translation function type */
import { Dumbbell } from "lucide-react";
import { LanguageModuleConfig } from "../../../types";

export const gymConfig: LanguageModuleConfig = {
    id: "gym",
    label: (t: any) => t("language.modules.gym", "Gym"),
    icon: Dumbbell,
    description: "Taaltraining via drills",
    color: "orange",
};
