---
description: Overview of VWO Elite lab architecture patterns and conventions
---

# Lab Architecture Guide

This document describes the standardized architecture patterns used across all labs in VWO Elite, based on **Feature Sliced Design (FSD)** principles.

## Core Pattern

All labs follow the `src/features/{featureName}` structure:

```text
src/features/{labname}/
├── api/
│   └── registry.ts          # Central module registry (Explicit exports)
├── hooks/
│   └── {LabName}Context.tsx # (Optional) React Context for UI state
├── types/
│   └── index.ts             # Type definitions
├── ui/
│   ├── {LabName}Layout.tsx  # Main layout component
│   └── modules/             # Sub-modules
│       └── {module}/
│           ├── config.tsx   # Module configuration export
│           └── index.ts     # Barrel file
└── stores/                  # (Optional) Zustand stores for complex logic
```

## Component Patterns

### Standard Pattern (Sidebar + Stage)

Used by most labs (Physics, Chemistry, Biology, etc.) to split controls from visualization.

```typescript
// types/index.ts
export interface ModuleConfig {
  id: string;
  label: (t: TFunction) => string;
  icon: LucideIcon;
  StageComponent: React.ComponentType; // Main visualization
  SidebarComponent?: React.ComponentType; // Left panel controls
  initialState?: Record<string, any>;
}
```

### Configuration Pattern (Explicit Registry)

Unlike the old "side-effect" pattern, we now use **explicit registration** in `api/registry.ts`.

1. **Define Config** in `ui/modules/{module}/config.tsx`:

```typescript
export const myModuleConfig: ModuleConfig = {
  id: "my-module",
  label: (t) => t("lab.modules.my_module"),
  icon: MyIcon,
  StageComponent: MyStage,
  SidebarComponent: MySidebar,
};
```

1. **Register** in `api/registry.ts`:

```typescript
import { myModuleConfig } from "../ui/modules/my-module/config";

export const getAllModules = () => [
  existingModuleConfig,
  myModuleConfig, // <--- Add here
];
```

## State Management

We favor **Zustand** for complex, cross-component state, and **React Context** only for layout/UI focus (like active module selection).

### Global/Shared State (Zustand)

Place stores in `src/shared/model` if reused, or `src/features/{lab}/stores` if private.

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useMyStore = create(persist(...));
```

## Lazy Loading (Performance)

Heavy modules (e.g., 3D scenes, complex charts) should use `React.lazy` within their Stage component or be wrapped if the module itself is large.

```typescript
const HeavyComponent = React.lazy(() => import("./HeavyComponent"));
```

## Translation

All labels must use `i18next`. Add keys to `src/locales/{lang}/{lab}.json`.
