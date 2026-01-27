---
description: How to add a new Research module using the feature slice architecture
---

# Adding a New Research Module

## Prerequisites

- Location: `src/features/research/ui/modules/`
- Registry: `src/features/research/api/registry.ts`

## Steps

1. **Folder**: `src/features/research/ui/modules/{name}/`
2. **Components**: `Stage`.
3. **Config**:

   ```typescript
   export const researchConfig: ResearchModuleConfig = {
     id: "sources",
     label: (t) => t("research.modules.sources"),
     icon: Database,
     StageComponent: SourcesStage,
   };
   ```

4. **Register**: Add to `src/features/research/api/registry.ts`.
