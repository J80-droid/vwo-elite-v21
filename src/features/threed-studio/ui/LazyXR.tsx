/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { Suspense } from "react";
// import type { XRProps } from '@react-three/xr'; // Not exported

// Dynamically import XR to avoid eager Three.js loading
const XR = React.lazy(async () => {
  const { XR } = (await import("@react-three/xr")) as any;
  return { default: XR };
});

export const LazyXR: React.FC<any> = (props) => {
  return (
    <Suspense fallback={null}>
      <XR {...props} />
    </Suspense>
  );
};
