import { Glasses } from "lucide-react";

import { ThreeDModuleConfig } from "../../../types";

export const stereoConfig: ThreeDModuleConfig = {
    id: "stereo",
    label: (t) => t("studio_3d.modules.stereo.label", "Stereo Kijken"),
    description: (t) =>
        t(
            "studio_3d.modules.stereo.description",
            "Zie diepte in 2D afbeeldingen door middel van stereogrammen en diepte-oefeningen.",
        ),
    icon: Glasses,
    color: "indigo",
    borderColor: "border-indigo-500/30",
};
