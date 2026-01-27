---
description: How to add a new Philosophy module using the feature slice architecture
---

# Adding a New Philosophy Module

## Prerequisites

- Location: `src/features/philosophy/ui/modules/`
- Registry: `src/features/philosophy/api/registry.ts`

## Steps

1. **Folder**: Create `src/features/philosophy/ui/modules/{name}/`
2. **Components**: Create `Stage` (Debate/Text) and optional `Sidebar`.
3. **Config**:

   ```typescript
   export const philosophyConfig: PhilosophyModuleConfig = {
     id: "ethics",
     label: (t) => t("philosophy.modules.ethics"),
     icon: Scale,
     StageComponent: EthicsStage,
     SidebarComponent: EthicsSidebar,
   };
   ```

4. **Register**: Add to `src/features/philosophy/api/registry.ts`.
