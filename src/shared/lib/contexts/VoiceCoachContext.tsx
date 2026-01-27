/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";

/**
 * VoiceCoachContext - Allows any view to inject context for the Voice Coach
 */

export interface VoiceCoachContextData {
  /** Name of the current view (e.g., "StereoTrainer") */
  viewName: string;
  /** Custom system instruction for the coach */
  systemPrompt: string;
  /** Dynamic context data that should be included in coaching */
  contextData?: Record<string, any>;
  /** Whether the coach should auto-start when FAB is clicked */
  autoStart?: boolean;
}

interface VoiceCoachContextValue {
  /** Current coaching context */
  context: VoiceCoachContextData | null;
  /** Set the coaching context (called by views) */
  setContext: (ctx: VoiceCoachContextData | null) => void;
  /** Whether the coach is currently active */
  isActive: boolean;
  /** Set whether the coach is active */
  setIsActive: (active: boolean) => void;
  /** Whether the FAB should be visible */
  showFAB: boolean;
  /** Control FAB visibility */
  setShowFAB: (show: boolean) => void;
}

const VoiceCoachContext = createContext<VoiceCoachContextValue | null>(null);

export const useVoiceCoach = () => {
  const ctx = useContext(VoiceCoachContext);
  if (!ctx) {
    throw new Error("useVoiceCoach must be used within VoiceCoachProvider");
  }
  return ctx;
};

interface VoiceCoachProviderProps {
  children: ReactNode;
}

export const VoiceCoachProvider: React.FC<VoiceCoachProviderProps> = ({
  children,
}) => {
  const [context, setContextState] = useState<VoiceCoachContextData | null>(
    null,
  );
  const [isActive, setIsActive] = useState(false);
  const [showFAB, setShowFAB] = useState(true);

  const setContext = useCallback((ctx: VoiceCoachContextData | null) => {
    setContextState(ctx);
  }, []);

  return (
    <VoiceCoachContext.Provider
      value={{
        context,
        setContext,
        isActive,
        setIsActive,
        showFAB,
        setShowFAB,
      }}
    >
      {children}
    </VoiceCoachContext.Provider>
  );
};

/**
 * Hook for views to register their coaching context
 */
export const useVoiceCoachContext = (
  viewName: string,
  systemPrompt: string,
  contextData?: Record<string, any>,
) => {
  const { setContext } = useVoiceCoach();

  // Register context on mount, clear on unmount
  React.useEffect(() => {
    setContext({
      viewName,
      systemPrompt,
      ...(contextData ? { contextData } : {}),
    });

    return () => {
      setContext(null);
    };
  }, [viewName, systemPrompt, JSON.stringify(contextData), setContext]);
};

export default VoiceCoachContext;
