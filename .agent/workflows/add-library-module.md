---
description: How to add a new Library module using the feature slice architecture
---

# Adding a New Library Module

## Prerequisites

- Location: `src/features/library/ui/tabs/` (Library uses tabs)
- Registry: `src/features/library/api/registry.ts`

## Steps

1. **Component**: Create `src/features/library/ui/tabs/{MyTab}.tsx`.
2. **Config**:

   ```typescript
   export const myTabConfig: LibraryTabConfig = {
     id: "my-tab",
     label: (t) => t("library.tabs.mine"),
     icon: BookOpen,
     Component: MyTab,
   };
   ```

3. **Register**: Add to `src/features/library/api/registry.ts`.
