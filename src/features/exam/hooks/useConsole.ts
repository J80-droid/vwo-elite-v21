import { LogEntry, LogLevel } from "@shared/types/exam";
import { v4 as uuidv4 } from "uuid";

import { useExamContext } from "./ExamContext";

/**
 * Hook to provide easy access to the system console for any component.
 */
export const useConsole = () => {
  const { examData, updateExamData } = useExamContext();

  /**
   * Log a message to the simulator console.
   */
  const log = (message: string, level: LogLevel = "info", source?: string) => {
    const newEntry: LogEntry = {
      id: uuidv4(),
      timestamp: Date.now(),
      level,
      message,
      source,
    };

    const currentLogs = examData.simulator?.logs || [];

    // Maintain a rolling window of 100 entries for performance
    const updatedLogs = [...currentLogs, newEntry].slice(-100);

    updateExamData("simulator", { logs: updatedLogs });
  };

  return {
    log,
    info: (msg: string, src?: string) => log(msg, "info", src),
    success: (msg: string, src?: string) => log(msg, "success", src),
    warn: (msg: string, src?: string) => log(msg, "warning", src),
    error: (msg: string, src?: string) => log(msg, "error", src),
    clear: () => updateExamData("simulator", { logs: [] }),
  };
};
