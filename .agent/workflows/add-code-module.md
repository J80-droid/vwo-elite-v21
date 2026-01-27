---
description: How to add a new Code module using the feature slice architecture
---

# Adding a New Code Module

## Prerequisites

- Location: `src/features/code/ui/modules/`
- Registry: `src/features/code/api/registry.ts`

## Steps

1. **Folder**: Create `src/features/code/ui/modules/{name}/`
2. **Components**: Create `Stage` (Editor/Terminal) and optional `Sidebar`.
3. **Config**:

   ```typescript
   export const codeConfig: CodeModuleConfig = {
     id: "python",
     label: (t) => t("code.modules.python"),
     icon: Terminal,
     StageComponent: PythonStage,
     SidebarComponent: PythonSidebar,
   };
   ```

4. **Register**: Add to `src/features/code/api/registry.ts`.
