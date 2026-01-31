import { Dumbbell } from "lucide-react";

import { BiologyModuleConfig } from "../../types";

export const gymConfig: BiologyModuleConfig = {
    id: "gym",
    label: (t) => t("biology.modules.gym", "Biology Gym"),
    icon: Dumbbell,
    description: "Train essential concepts and terminology.",
    color: "text-emerald-400",
    borderColor: "border-emerald-500/30",
};
