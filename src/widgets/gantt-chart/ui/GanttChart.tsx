import "./GanttChart.css";

import { getTaskColor } from "@entities/planner/model/task";
import { usePlannerEliteStore } from "@shared/model/plannerStore";
import React, { useMemo } from "react";

const daysOfWeek = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

export const GanttChart: React.FC = () => {
  const { tasks } = usePlannerEliteStore();
  const [_tick, setTick] = React.useState(0);

  // Force update on planner event (Fail-safe)
  React.useEffect(() => {
    const handleUpdate = () => setTick((t) => t + 1);
    window.addEventListener("plannerUpdated", handleUpdate);
    return () => window.removeEventListener("plannerUpdated", handleUpdate);
  }, []);

  // Calculate the range of the timeline (Current week)
  const timelineDates = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

    return Array.from({ length: 14 }, (_, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      return {
        full: date.toISOString().split("T")[0],
        day: date.getDate(),
        label: daysOfWeek[i % 7],
        isToday: date.toDateString() === today.toDateString(),
      };
    });
  }, []);

  // Filter homework tasks (Broadened to include study/exam/personal/lesson)
  const homeworkTasks = useMemo(() => {
    const todayDate = new Date();
    const todayStr = todayDate.toISOString().split("T")[0]!;

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 14);
    const endStr = endDate.toISOString().split("T")[0]!;

    return tasks
      .filter((t) => {
        // Include everything that isn't completed and is in the 14-day window
        if (t.completed) return false;
        // Exclude imported Somtoday tasks (lessons, imported homework) - User wants manual tasks only
        if (t.source === "import") return false;

        return t.date >= todayStr && t.date <= endStr;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [tasks]);

  const findDayOffset = (dateStr: string) => {
    return timelineDates.findIndex((d) => d.full === dateStr);
  };

  return (
    <div className="gantt-container">
      <div className="gantt-header">
        <div className="gantt-title">HUISWERK TIJDLIJN</div>
        <div className="gantt-legend">
          <span className="legend-item">
            <span className="dot" style={{ background: "#39ff14" }}></span>{" "}
            Vandaag
          </span>
        </div>
      </div>

      <div className="gantt-timeline-wrapper">
        <div className="gantt-grid">
          {/* Header: Days */}
          <div className="gantt-grid-header">
            <div className="gantt-label-col">Vak / Taak</div>
            <div className="gantt-timeline-col">
              {timelineDates.map((date) => (
                <div
                  key={date.full}
                  className={`gantt-day-label ${date.isToday ? "active" : ""}`}
                >
                  <span className="day-name">{date.label}</span>
                  <span className="day-num">{date.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Content: Tasks */}
          <div className="gantt-rows">
            {homeworkTasks.length > 0 ? (
              homeworkTasks.map((task) => {
                const dayOffset = findDayOffset(task.date);
                if (dayOffset === -1) return null;

                const taskColor = getTaskColor(task);

                return (
                  <div key={task.id} className="gantt-row">
                    <div className="gantt-label-col">
                      <div className="subject-tag" style={{ color: taskColor }}>
                        {task.subject || "Algemeen"}
                      </div>
                      <div className="task-title" title={task.title}>
                        {task.title}
                      </div>
                    </div>
                    <div className="gantt-timeline-col">
                      <div className="gantt-slot-bg">
                        {timelineDates.map((d) => (
                          <div
                            key={d.full}
                            className={`gantt-cell ${d.isToday ? "today" : ""}`}
                          />
                        ))}
                      </div>
                      <div
                        className="gantt-bar-wrapper"
                        style={{
                          left: `calc(${(dayOffset / 14) * 100}% + 4px)`,
                          width: `calc(${(1 / 14) * 100}% - 8px)`,
                        }}
                      >
                        <div
                          className="gantt-bar"
                          style={{
                            backgroundColor: `${taskColor}22`,
                            borderColor: taskColor,
                            boxShadow: `0 0 10px ${taskColor}44`,
                            color: taskColor,
                          }}
                        >
                          <div
                            className="gantt-bar-glow"
                            style={{ background: taskColor }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="gantt-empty">
                Geen huiswerkopdrachten gevonden voor de komende 2 weken.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
