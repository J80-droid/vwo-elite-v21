import { PWSChecklistItem } from "@shared/types/pws";
import React from "react";

interface ChecklistWidgetProps {
  currentPhase: string;
  checklist: readonly PWSChecklistItem[];
  checklistProgress: Record<string, boolean>;
  onToggle: (itemId: string) => void;
}

export const ChecklistWidget: React.FC<ChecklistWidgetProps> = ({
  currentPhase,
  checklist,
  checklistProgress,
  onToggle,
}) => {
  return (
    <div className="mb-6 bg-obsidian-950/50 p-3 rounded-lg border border-white/5">
      <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">
        Checklist {currentPhase}
      </h3>
      <div className="space-y-2">
        {checklist.map((item) => (
          <label
            key={item.id}
            className="flex items-start gap-2 cursor-pointer group"
          >
            <input
              type="checkbox"
              checked={!!checklistProgress[item.id]}
              onChange={() => onToggle(item.id)}
              className="mt-0.5"
            />
            <span
              className={`text-xs group-hover:text-white transition-colors ${
                checklistProgress[item.id]
                  ? "text-slate-500 line-through"
                  : "text-slate-300"
              }`}
            >
              {item.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
};
