---
description: How to add a new Psychology module using the feature slice architecture
---

# Adding a New Psychology Module

## Prerequisites

- Location: `src/features/psychology/ui/modules/`
- Registry: `src/features/psychology/api/registry.ts`

## Steps

1. **Folder**: Create `src/features/psychology/ui/modules/{name}/`
2. **Components**: Create `Stage` (Experiment/Theory) and optional `Sidebar`.
3. **Config**:

   ```typescript
   export const psychologyConfig: PsychologyModuleConfig = {
     id: "behavior",
     label: (t) => t("psychology.modules.behavior"),
     icon: BrainCircuit,
     StageComponent: BehaviorStage,
     SidebarComponent: BehaviorSidebar,
   };
   ```

4. **Register**: Add to `src/features/psychology/api/registry.ts`.
