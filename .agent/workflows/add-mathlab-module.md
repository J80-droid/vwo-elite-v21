---
description: How to add a new MathLab module used the feature slice architecture
---

# Adding a New MathLab Module

MathLab uses a unique **3-panel layout** and the Feature Slice Architecture.

## Prerequisites

- Location: `src/features/math/ui/modules/`
- Registry: `src/features/math/api/registry.ts`
- Structure: Params (Center), Input (Left), Results (Right), Stage (Visual)

## Step 1: Create Module Folder

Create: `src/features/math/ui/modules/{modulename}/`

## Step 2: Define Components

MathLab modules typically need multiple components:

1. **InputComponent**: For typing expressions (Left)
2. **ParamsComponent**: For sliders/settings (Center)
3. **ResultsComponent**: For output/tables (Right)
4. **StageComponent**: For graphs/geometry (Main Stage)

## Step 3: Create config.tsx

```typescript
// src/features/math/ui/modules/{modulename}/config.tsx
import { MathModuleConfig } from "../../../types";
import { MyInput } from "./MyInput";
import { MyParams } from "./MyParams";
import { MyResults } from "./MyResults";
import { MyStage } from "./MyStage";

export const moduleNameConfig: MathModuleConfig = {
  id: "modulename",
  label: (t) => t("math.modules.name"),
  icon: MyIcon,
  InputComponent: MyInput,
  ParamsComponent: MyParams,
  ResultsComponent: MyResults,
  StageComponent: MyStage,
};
```

## Step 4: Register Module

Open `src/features/math/api/registry.ts`:

```typescript
import { moduleNameConfig } from "../ui/modules/{modulename}/config";

export const getAllModules = () => [
  // ...
  moduleNameConfig,
];
```
