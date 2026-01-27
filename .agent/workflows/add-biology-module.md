---
description: How to add a new Biology module using the feature slice architecture
---

# Adding a New Biology Module

The Biology Lab uses the **Feature Sliced Architecture**. Modules are explicitly registered in the API layer.

## Prerequisites

- Location: `src/features/biology/ui/modules/`
- Registry: `src/features/biology/api/registry.ts`
- Icons: Use `lucide-react`

## Step 1: Create Module Folder

Create a folder: `src/features/biology/ui/modules/{modulename}/`

Structure:

```text
src/features/biology/ui/modules/{modulename}/
├── config.tsx            # Export configuration
├── index.ts              # Barrel file
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
        <div className="w-full h-full p-6">
            <h2 className="text-2xl text-emerald-400">Biology Module</h2>
        </div>
    );
};
```

## Step 3: Create config.tsx

Define and export the configuration.

```typescript
// src/features/biology/ui/modules/{modulename}/config.tsx

import { Dna } from "lucide-react";
import { BiologyModuleConfig } from "../../../types";
import { ModuleNameStage } from "./{ModuleName}Stage";
import { ModuleNameSidebar } from "./{ModuleName}Sidebar";

export const moduleNameConfig: BiologyModuleConfig = {
  id: "modulename",
  label: (t) => t("biology.modules.module_name"),
  icon: Dna,
  StageComponent: ModuleNameStage,
  SidebarComponent: ModuleNameSidebar,
  initialState: {},
};
```

## Step 4: Register Module

Open `src/features/biology/api/registry.ts` and add your module.

```typescript
// src/features/biology/api/registry.ts
import { moduleNameConfig } from "../ui/modules/{modulename}/config";

export const getAllModules = () => [
  // ... other modules
  moduleNameConfig, // <-- Add here
];
```

## Step 5: Add Translation

Add label key to `src/locales/{lang}/biology.json`.
