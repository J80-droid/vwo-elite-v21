/* eslint-disable react-refresh/only-export-components */
import { AILabModuleId } from "@features/ai-lab/types";
import React, { createContext, ReactNode, useContext, useState } from "react";

interface AILabContextType {
  activeModuleId: AILabModuleId;
  setActiveModuleId: (id: AILabModuleId) => void;
}

const AILabContext = createContext<AILabContextType | undefined>(undefined);

export const AILabProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [activeModuleId, setActiveModuleId] = useState<AILabModuleId>("");

  return (
    <AILabContext.Provider value={{ activeModuleId, setActiveModuleId }}>
      {children}
    </AILabContext.Provider>
  );
};

export const useAILab = () => {
  const context = useContext(AILabContext);
  if (!context) {
    throw new Error("useAILab must be used within an AILabProvider");
  }
  return context;
};
