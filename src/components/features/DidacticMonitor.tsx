/* eslint-disable react-hooks/exhaustive-deps */

import { EliteTask } from "@entities/planner/model/task";
import { generateRepairSessions } from "@shared/api/retrogradeEngine";
import { usePlannerEliteStore } from "@shared/model/plannerStore";
import React, { useEffect, useRef } from "react";

export const DidacticMonitor: React.FC = () => {
  const { tasks, addTask, settings } = usePlannerEliteStore();

  // Track previous state to detect changes
  const prevTasksRef = useRef<Record<string, EliteTask>>({});

  useEffect(() => {
    // Initialize ref on first load
    if (Object.keys(prevTasksRef.current).length === 0 && tasks.length > 0) {
      tasks.forEach((t) => {
        prevTasksRef.current[t.id] = t;
      });
      return;
    }

    // Check for updates
    tasks.forEach((currentTask) => {
      const prevTask = prevTasksRef.current[currentTask.id];

      // Scenario 1: Task Completed with Low Grade (or Grade Updated to Low)
      if (currentTask.gradeAchieved !== undefined) {
        const grade = currentTask.gradeAchieved;
        const prevGrade = prevTask?.gradeAchieved;

        const isNewGrade = grade !== prevGrade;
        const isFailure = grade < 5.5;

        if (isNewGrade && isFailure) {
          console.log(
            `[DidacticMonitor] Detected failure for ${currentTask.subject}: ${grade}`,
          );

          // Trigger Repair Workflow
          triggerRepair(currentTask);
        }
      }
    });

    // Update ref
    const newRef: Record<string, EliteTask> = {};
    tasks.forEach((t) => {
      newRef[t.id] = t;
    });
    prevTasksRef.current = newRef;
  }, [tasks]);

  const triggerRepair = (failedTask: EliteTask) => {
    if (!settings.region) return;

    // 1. Generate Repair Sessions
    const repairSessions = generateRepairSessions(
      failedTask.topic || "Algemeen",
      failedTask.gradeAchieved || 1,
      failedTask.subject || "Algemeen",
      settings.region,
    );

    if (repairSessions.length === 0) return;

    // 2. Add to Store
    repairSessions.forEach((session) => {
      addTask({
        ...session,
        parentTaskId: failedTask.id,
        description: `Automatisch ingepland na cijfer ${failedTask.gradeAchieved}. ${session.description}`,
      });
    });

    // 3. Notify User (Could be a toast in the future)
    // For now, allow the browser to alert if focused, but better to just let it happen silently
    // or use a custom toast hook if available.
    // We'll trust the Dashboard "Active Missions" to show it.
  };

  return null; // Invisible component
};
