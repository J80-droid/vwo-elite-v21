---
description: How to add a new Chemistry module using the feature slice architecture
---

# Adding a New Chemistry Module

The Chemistry Lab uses the **Feature Sliced Architecture**. Modules are explicitly registered in the API layer.

## Prerequisites

- Location: `src/features/chemistry/ui/modules/`
- Registry: `src/features/chemistry/api/registry.ts`
- Icons: Use `lucide-react`

## Step 1: Create Module Folder

Create a folder: `src/features/chemistry/ui/modules/{modulename}/`

Structure:

```text
src/features/chemistry/ui/modules/{modulename}/
├── config.tsx            # Export configuration
├── index.ts              # Barrel file (optional)
├── {ModuleName}Stage.tsx      # Main Stage Component
└── {ModuleName}Sidebar.tsx    # Sidebar Controls (Optional)
```

## Step 2: Define Components

Create your Stage and/or Sidebar components.

```typescript
// {ModuleName}Stage.tsx
import React from 'react';

export const ModuleNameStage: React.FC = () => {
    return (
        <div className="p-4">
            <h2 className="text-xl font-bold text-white">My Chemistry Module</h2>
            {/* Vizualization here */}
        </div>
    );
};
```

## Step 3: Create config.tsx

Define and export the configuration.

```typescript
// src/features/chemistry/ui/modules/{modulename}/config.tsx

import { FlaskConical } from "lucide-react";
import { ChemistryModuleConfig } from "../../../types";
import { ModuleNameStage } from "./{ModuleName}Stage";
import { ModuleNameSidebar } from "./{ModuleName}Sidebar";

export const moduleNameConfig: ChemistryModuleConfig = {
  id: "modulename",
  label: (t) => t("chemistry.modules.module_name"),
  description: (t) => t("chemistry.modules.module_desc"),
  icon: FlaskConical,
  StageComponent: ModuleNameStage,
  InputComponent: ModuleNameSidebar, // Note: Chemistry often uses InputComponent/ParamsComponent depending on layout
  initialState: {},
};
```

## Step 4: Register Module

Open `src/features/chemistry/api/registry.ts` and add your module.

```typescript
// src/features/chemistry/api/registry.ts
import { moduleNameConfig } from "../ui/modules/{modulename}/config";

export const getAllModules = () => [
  // ... other modules
  moduleNameConfig, // <-- Add here
];
```

## Step 5: Add Translation

Add keys to `src/locales/{lang}/chemistry.json`:

```json
{
  "modules": {
    "module_name": "My Module",
    "module_desc": "Description..."
  }
}
```
