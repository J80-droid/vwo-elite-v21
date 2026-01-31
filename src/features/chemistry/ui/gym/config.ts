import { Dumbbell } from "lucide-react";

import { ChemistryModuleConfig } from "../../types";

export const gymConfig: ChemistryModuleConfig = {
    id: "gym",
    label: (t) => t("chemistry.modules.gym", "Chemistry Gym"),
    icon: Dumbbell,
    description: (t) => t("chemistry.modules.gym_desc", "Practice reactions and stoichiometry."),
};
