import { useOptionalPhysicsLabContext } from "@features/physics";
import { useMemo } from "react";

export interface SimplePhysicsState {
  objects: Record<string, unknown>; // Mapped from active module state
  isRunning: boolean;
}

export function usePhysicsContext() {
  // Use the optional context from public API
  const contextData = useOptionalPhysicsLabContext();

  // Use useMemo to transform the context data into a simplified state.
  // This avoids cascading renders caused by useState + useEffect.
  return useMemo(() => {
    if (!contextData) return null;

    const { globalSettings, state: activeModuleState } = contextData;

    const isRunning = !globalSettings?.isPaused;

    // Map valid state. We assume activeModuleState contains the simulation entities.
    const objects = (activeModuleState as Record<string, unknown>) || {};

    return {
      objects,
      isRunning,
    } as SimplePhysicsState;
  }, [contextData]);
}
