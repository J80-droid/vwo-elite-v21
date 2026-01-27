/* eslint-disable react-hooks/rules-of-hooks */
import { usePlannerEliteStore } from "@shared/model/plannerStore";
import React, { useMemo } from "react";

const MODULE_COMPONENTS: Record<
  string,
  {
    Input?: React.FC;
    Params?: React.FC;
    Stage?: React.FC;
    Results?: React.FC;
    Sidebar?: React.FC;
  }
> = {
  homework: {
    Stage: React.lazy(() =>
      import("./modules/homework/HomeworkStage").then((m) => ({
        default: m.HomeworkStage,
      })),
    ),
  },
  exams: {
    Stage: React.lazy(() =>
      import("./modules/exams/ExamsStage").then((m) => ({
        default: m.ExamsStage,
      })),
    ),
  },
  pws: {
    Stage: React.lazy(() =>
      import("./modules/pws/PWStage").then((m) => ({ default: m.PWStage })),
    ),
  },
  calendar: {
    Stage: React.lazy(() =>
      import("./modules/calendar/CalendarStage").then((m) => ({
        default: m.CalendarStage,
      })),
    ),
    Sidebar: React.lazy(() =>
      import("./modules/calendar/CalendarSidebar").then((m) => ({
        default: m.CalendarSidebar,
      })),
    ),
  },
  tasks: {
    Stage: React.lazy(() =>
      import("./modules/tasks").then((m) => ({ default: m.TasksStage })),
    ),
  },
  analytics: {
    Stage: React.lazy(() =>
      import("./modules/analytics/AnalyticsStage").then((m) => ({
        default: m.AnalyticsStage,
      })),
    ),
  },
  settings: {
    Stage: React.lazy(() =>
      import("./modules/settings/SettingsStage").then((m) => ({
        default: m.SettingsStage,
      })),
    ),
  },
  timeline: {
    Stage: React.lazy(() =>
      import("./modules/timeline/TimelineStage").then((m) => ({
        default: m.TimelineStage,
      })),
    ),
  },
  grades: {
    Stage: React.lazy(() =>
      import("./modules/grades/GradeOverview").then((m) => ({
        default: m.GradeOverview,
      })),
    ),
  },
};

export const usePlannerContent = () => {
  const activeModule = usePlannerEliteStore((state) => state.activeModule);

  const config = MODULE_COMPONENTS[activeModule];
  if (!config)
    return {
      Input: null,
      Params: null,
      Stage: null,
      Results: null,
      Sidebar: null,
    };

  return useMemo(() => {
    const { Stage, Input, Params, Results, Sidebar } = config;

    return {
      Input: Input ? (
        <React.Suspense
          fallback={
            <div className="h-20 animate-pulse bg-white/5 rounded-xl" />
          }
        >
          <Input />
        </React.Suspense>
      ) : null,
      Params: Params ? (
        <React.Suspense
          fallback={
            <div className="h-20 animate-pulse bg-white/5 rounded-xl" />
          }
        >
          <Params />
        </React.Suspense>
      ) : null,
      Results: Results ? (
        <React.Suspense
          fallback={
            <div className="h-20 animate-pulse bg-white/5 rounded-xl" />
          }
        >
          <Results />
        </React.Suspense>
      ) : null,
      Stage: Stage ? (
        <React.Suspense
          fallback={
            <div className="flex-1 flex items-center justify-center text-rose-500 animate-pulse">
              Initializing Planner Module...
            </div>
          }
        >
          <Stage />
        </React.Suspense>
      ) : null,
      Sidebar: Sidebar ? (
        <React.Suspense
          fallback={<div className="w-full h-full animate-pulse bg-white/5" />}
        >
          <Sidebar />
        </React.Suspense>
      ) : null,
    };
  }, [config]);
};
