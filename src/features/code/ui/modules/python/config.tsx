/* eslint-disable @typescript-eslint/no-explicit-any */
import { Database, FileCode, Globe } from "lucide-react";

import { registerModule } from "../../../api/registry";
import { CodeModuleConfig } from "../../../types";

export const pythonConfig: CodeModuleConfig = {
  id: "python",
  label: (t: any) => t("code.modules.python"),
  description: "Wetenschappelijk Rekenen & Data-analyse",
  icon: FileCode,
  color: "text-blue-400",
  borderColor: "border-blue-500",
};

registerModule(pythonConfig);

export const webConfig: CodeModuleConfig = {
  id: "web",
  label: (t: any) => t("code.modules.web"),
  description: "HTML/CSS/JS Speeltuin",
  icon: Globe,
  color: "text-orange-400",
  borderColor: "border-orange-500",
};
registerModule(webConfig);

export const sqlConfig: CodeModuleConfig = {
  id: "sql",
  label: (t: any) => t("code.modules.sql"),
  description: "Database Queries",
  icon: Database,
  color: "text-emerald-400",
  borderColor: "border-emerald-500",
};
registerModule(sqlConfig);
