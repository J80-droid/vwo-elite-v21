/* eslint-disable react-refresh/only-export-components */
import { ExamIndexEntry } from "@shared/types/dashboard";
import {
  ExamContextType,
  ExamModule,
  ExamSessionData,
} from "@shared/types/exam";
import React, { createContext, useContext, useMemo, useState } from "react";

const ExamContext = createContext<ExamContextType | undefined>(undefined);

export const ExamProvider: React.FC<{
  children: React.ReactNode;
  initialModule?: ExamModule;
}> = ({ children, initialModule = "dashboard" }) => {
  const [activeModule, setActiveModule] = useState<ExamModule>(initialModule);
  const [isConsoleOpen, setIsConsoleOpen] = useState(true);
  const [consoleHeight, setConsoleHeight] = useState(400);
  const [activeExam, setActiveExam] = useState<ExamIndexEntry | null>(null);

  // Initialize with typed data
  const [examData, setExamData] = useState<Partial<ExamSessionData>>({
    simulator: {
      stepIndex: 0,
      variables: {},
      logs: [],
      code: "",
    },
    trainer: {
      progress: 0,
    },
  });

  // Type-Safe update function
  const updateExamData = <K extends keyof ExamSessionData>(
    module: K,
    data: Partial<ExamSessionData[K]>,
  ) => {
    setExamData((prev) => ({
      ...prev,
      [module]: {
        ...(prev[module] || {}), // Removed any, using fallback
        ...data,
      },
    }));
  };

  // Performance optimization: Memoize context value
  const value = useMemo(
    () => ({
      activeModule,
      isConsoleOpen,
      consoleHeight,
      activeExam,
      examData,
      setActiveModule,
      setIsConsoleOpen,
      setConsoleHeight,
      setActiveExam,
      updateExamData,
    }),
    [activeModule, isConsoleOpen, consoleHeight, activeExam, examData],
  );

  return <ExamContext.Provider value={value}>{children}</ExamContext.Provider>;
};

export const useExamContext = () => {
  const context = useContext(ExamContext);
  if (!context) {
    throw new Error("useExamContext must be used within an ExamProvider");
  }
  return context;
};
