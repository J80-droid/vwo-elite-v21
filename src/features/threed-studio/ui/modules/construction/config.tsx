import { Construction } from "lucide-react";
import { ThreeDModuleConfig } from "../../../types";

export const constructionConfig: ThreeDModuleConfig = {
    id: "construction",
    label: (t) => t("studio_3d.modules.construction.label", "Construction Game"),
    description: (t) =>
        t(
            "studio_3d.modules.construction.description",
            "Bouw complexe constructies op basis van technische tekeningen en specificaties.",
        ),
    icon: Construction,
    color: "blue",
    borderColor: "border-blue-500/30",
};
