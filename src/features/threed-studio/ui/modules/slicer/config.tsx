import { Scissors } from "lucide-react";
import { ThreeDModuleConfig } from "../../../types";

export const slicerConfig: ThreeDModuleConfig = {
    id: "slicer",
    label: (t) => t("studio_3d.modules.slicer.label", "Dynamic Slicer"),
    description: (t) =>
        t(
            "studio_3d.modules.slicer.description",
            "Doorsnijd complexe 3D vormen en bestudeer de resulterende 2D vlakken.",
        ),
    icon: Scissors,
    color: "rose",
    borderColor: "border-rose-500/30",
};
