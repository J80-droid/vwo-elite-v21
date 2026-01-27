---
description: How to add a new Brainstorm module using the feature slice architecture
---

# Adding a New Brainstorm Module

The Brainstorm Lab system uses a **plugin-style module architecture**. New modules can be added without modifying the core `BrainstormLabLayout.tsx` or complex context files.

## Prerequisites

- Location: `src/features/brainstorm/ui/modules/`
- Registry: `src/features/brainstorm/api/registry.ts`

## Steps

1. **Folder**: Create `src/features/brainstorm/ui/modules/{name}/`
2. **Components**: Create `Stage` (Canvas/Board) and optional `Sidebar`.
3. **Config**:

   ```typescript
   export const brainstormConfig: BrainstormModuleConfig = {
     id: "mindmap",
     label: (t) => t("brainstorm.modules.mindmap"),
     icon: Network,
     StageComponent: MindMapStage,
     SidebarComponent: MindMapSidebar,
   };
   ```

4. **Register**: Add to `src/features/brainstorm/api/registry.ts`.
