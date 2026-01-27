---
description: How to add a new Planner module using the feature slice architecture
---

# Adding a New Planner Module

## Prerequisites

- Location: `src/features/planner/ui/modules/`
- Registry: `src/features/planner/api/registry.ts`

## Steps

1. **Folder**: `src/features/planner/ui/modules/{name}/`
2. **Components**: `Stage`.
3. **Config**:

   ```typescript
   export const plannerConfig: PlannerModuleConfig = {
     id: "calendar",
     label: (t) => t("planner.modules.calendar"),
     icon: Calendar,
     StageComponent: CalendarStage,
   };
   ```

4. **Register**: Add to `src/features/planner/api/registry.ts`.
