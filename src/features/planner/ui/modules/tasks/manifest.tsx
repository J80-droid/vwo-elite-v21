/* eslint-disable @typescript-eslint/no-explicit-any */
import { registerModule } from "@features/planner/api/registry";
import { PlannerModuleConfig } from "@features/planner/types";
import { ListTodo } from "lucide-react";

export const tasksConfig: PlannerModuleConfig = {
  id: "tasks",
  label: (t: any) => t("planner.modules.tasks"),
  icon: ListTodo,
  description: "Manage your daily tasks",
  color: "text-emerald-400",
  borderColor: "border-emerald-500",
};

// Auto-register on import
registerModule(tasksConfig);
