---
description: How to add a new Exam module using the feature slice architecture
---

# Adding a New Exam Module

## Prerequisites

- Location: `src/features/exam/ui/modules/`
- Registry: `src/features/exam/api/registry.ts`

## Steps

1. **Folder**: Create `src/features/exam/ui/modules/{name}/`
2. **Components**: Create `Stage` (Exam Interface).
3. **Config**:

   ```typescript
   export const examConfig: ExamModuleConfig = {
     id: "eindexamen-2025",
     label: (t) => t("exam.modules.2025"),
     icon: Scroll,
     StageComponent: ExamStage,
   };
   ```

4. **Register**: Add to `src/features/exam/api/registry.ts`.
