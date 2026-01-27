/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Analytics Module Configuration
 */

import {
  defaultAnalyticsState,
  type MathModuleConfig,
} from "@features/math/types";
import { LineChart } from "lucide-react";
export const analyticsConfig: MathModuleConfig = {
  id: "analytics",
  label: (t: any) => t("calculus.layout.plot_analytics"),
  icon: LineChart,
  color: "text-emerald-400",
  borderColor: "border-emerald-500",
  initialState: defaultAnalyticsState,
};

// Auto-register on import
// registerModule(analyticsConfig); - Moved to centralized registration
