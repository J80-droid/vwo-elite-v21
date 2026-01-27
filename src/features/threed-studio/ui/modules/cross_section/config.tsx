import { ThreeDModuleConfig } from "../../../types";
import { SquareSplitVertical } from "lucide-react";

export const crossSectionConfig: ThreeDModuleConfig = {
    id: "cross_section",
    label: (t) => t("studio_3d.modules.cross_section.label", "Doorsnedes"),
    description: (t) =>
        t(
            "studio_3d.modules.cross_section.description",
            "Oefen met het herkennen van 2D doorsnedes van verschillende 3D lichamen.",
        ),
    icon: SquareSplitVertical,
    color: "violet",
    borderColor: "border-violet-500/30",
};
