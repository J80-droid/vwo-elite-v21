import { Hammer } from "lucide-react";
import { ThreeDModuleConfig } from "../../../types";

export const buildConfig: ThreeDModuleConfig = {
    id: "build",
    label: (t) => t("studio_3d.modules.build.label", "Free Build Mode"),
    description: (t) =>
        t(
            "studio_3d.modules.build.description",
            "Bouw je eigen 3D structuren met verschillende blokken en materialen.",
        ),
    icon: Hammer,
    color: "amber",
    borderColor: "border-amber-500/30",
};
