import React from "react";

import { usePlannerContent } from "./PlannerContent";
// Force Rebuild
import { PlannerLayout } from "./PlannerLayout";

const StudyPlannerInner: React.FC = () => {
  // Dynamic Content
  const { Stage, Sidebar } = usePlannerContent();

  return (
    <PlannerLayout
      sidebar={
        Sidebar ? (
          <React.Suspense
            fallback={
              <div className="p-4 text-xs text-slate-500">Laden...</div>
            }
          >
            {Sidebar}
          </React.Suspense>
        ) : null
      }
    >
      <React.Suspense
        fallback={
          <div className="h-full w-full flex items-center justify-center text-slate-500">
            Module laden...
          </div>
        }
      >
        {Stage}
      </React.Suspense>
    </PlannerLayout>
  );
};

const Planner: React.FC = () => {
  return <StudyPlannerInner />;
};

export default Planner;
