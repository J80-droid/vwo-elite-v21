---
description: How to add a new Language module using the feature slice architecture
---

# Adding a New Language Module

## Prerequisites

- Location: `src/features/language/ui/modules/`
- Registry: `src/features/language/api/registry.ts`

## Steps

1. **Folder**: Create `src/features/language/ui/modules/{name}/`
2. **Components**: Create `Stage` (Exercises/Content) and optional `Sidebar`.
3. **Config**:

   ```typescript
   export const languageConfig: LanguageModuleConfig = {
     id: "vocabulary",
     label: (t) => t("language.modules.vocabulary"),
     icon: Languages,
     StageComponent: VocabStage,
     SidebarComponent: VocabSidebar,
   };
   ```

4. **Register**: Add to `src/features/language/api/registry.ts`.
