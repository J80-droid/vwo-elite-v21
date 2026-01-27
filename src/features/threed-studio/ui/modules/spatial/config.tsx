import { Box } from "lucide-react";

import { ThreeDModuleConfig } from "../../../types";

export const spatialConfig: ThreeDModuleConfig = {
    id: "spatial",
    label: (t) => t("studio_3d.modules.spatial.label", "Ruimtelijk Inzicht"),
    description: (t) =>
        t(
            "studio_3d.modules.spatial.description",
            "Train je vermogen om 3D objecten in je hoofd te draaien en te analyseren.",
        ),
    icon: Box,
    color: "cyan",
    borderColor: "border-cyan-500/30",
};
