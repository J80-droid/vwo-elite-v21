---
description: How to add a new Settings module/tab using the manual registration architecture
---

# Adding a New Settings Tab

## Prerequisites

- Location: `src/features/settings/ui/modules/`
- Registry: `src/features/settings/api/registry.ts`

## Steps

1. **Folder**: `src/features/settings/ui/modules/{name}/`
2. **Components**: `SettingsComponent`.
3. **Config**:

   ```typescript
   export const settingsConfig: SettingsModuleConfig = {
     id: "profile",
     label: (t) => t("settings.tabs.profile"),
     icon: User,
     Component: ProfileSettings,
   };
   ```

4. **Register**: Add to `src/features/settings/api/registry.ts`.
