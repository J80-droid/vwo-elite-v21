import { Layers } from "lucide-react";

import { ThreeDModuleConfig } from "../../../types";

export const projectionConfig: ThreeDModuleConfig = {
    id: "projection",
    label: (t) => t("studio_3d.modules.projection.label", "Projecties"),
    description: (t) =>
        t(
            "studio_3d.modules.projection.description",
            "Leer hoe 3D objecten worden vertaald naar 2D aanzichten (voor-, boven- en zijijanzichten).",
        ),
    icon: Layers,
    color: "emerald",
    borderColor: "border-emerald-500/30",
};
