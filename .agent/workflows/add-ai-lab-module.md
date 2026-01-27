---
description: Create a new standard feature module with Elite architecture
---

# Add AI Lab Module

1. Run the scaffolding automation:

   ```powershell
   powershell -ExecutionPolicy Bypass -File .agent/skills/project-conventions/scripts/scaffold_feature.ps1 <ModuleName>
   ```

2. Register the route in `src/App.tsx`:

   ```tsx
   import { Main<ModuleName>Layout } from './features/<module>/ui/modules/Main<ModuleName>Layout';
   // ...
   <Route path="/<module>" element={<Main<ModuleName>Layout />} />
   ```

3. (Optional) Add to `Sidebar.tsx` if it needs a menu item.
