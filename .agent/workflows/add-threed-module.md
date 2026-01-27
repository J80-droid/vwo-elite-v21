---
description: How to add a new 3D Studio module using the feature slice architecture
---

# Adding a New 3D Studio Module

## Prerequisites

- Location: `src/features/threed-studio/ui/modules/`
- Registry: `src/features/threed-studio/api/registry.ts`

## Step 1: Create Module Folder

`src/features/threed-studio/ui/modules/{modulename}/`

## Step 2: Components

Create your Stage component. Since 3D Studio uses R3F (React Three Fiber), your stage usually contains `<Canvas>` elements or is wrapped by one in the layout.

```typescript
export const MyStage = () => (
    <mesh>
        <boxGeometry />
        <meshStandardMaterial color="hotpink" />
    </mesh>
);
```

## Step 3: Config

```typescript
// config.tsx
import { Box } from "lucide-react";
import { ThreeDModuleConfig } from "../../../types";
import { MyStage } from "./MyStage";

export const my3DModuleConfig: ThreeDModuleConfig = {
  id: "my-3d",
  label: (t) => t("threed.modules.name"),
  icon: Box,
  StageComponent: MyStage,
};
```

## Step 4: Register

Add to `src/features/threed-studio/api/registry.ts`.
