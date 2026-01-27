/* eslint-disable @typescript-eslint/no-explicit-any */
import { useTranslations } from "@shared/hooks/useTranslations";
import { Check, RotateCw, X } from "lucide-react";
import React, { useState } from "react";

interface RecurrenceSettings {
  frequency: "daily" | "weekly" | "monthly";
  interval: number; // e.g., every 2 weeks
  days: number[]; // 0-6 (Sun-Sat) for weekly
  endDate?: string;
  occurrences?: number;
  endType: "never" | "date" | "count";
}

interface RecurrenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: RecurrenceSettings) => void;
  initialSettings?: Partial<RecurrenceSettings>;
}

export const RecurrenceModal: React.FC<RecurrenceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialSettings,
}) => {
  const { t } = useTranslations();
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">(
    initialSettings?.frequency || "weekly",
  );
  const [interval, setInterval] = useState(initialSettings?.interval || 1);
  const [selectedDays, setSelectedDays] = useState<number[]>(
    initialSettings?.days || [],
  );
  const [endType, setEndType] = useState<"never" | "date" | "count">(
    initialSettings?.endType || "count",
  );
  const [endDate, setEndDate] = useState(initialSettings?.endDate || "");
  const [occurrences, setOccurrences] = useState(
    initialSettings?.occurrences || 10,
  );

  if (!isOpen) return null;

  const handleDayToggle = (dayIndex: number) => {
    if (selectedDays.includes(dayIndex)) {
      setSelectedDays(selectedDays.filter((d) => d !== dayIndex));
    } else {
      setSelectedDays([...selectedDays, dayIndex].sort());
    }
  };

  const handleSave = () => {
    onSave({
      frequency: frequency as "daily" | "weekly" | "monthly",
      interval,
      days: selectedDays,
      endType: endType as "never" | "date" | "count",
      endDate: endType === "date" ? endDate : undefined,
      occurrences: endType === "count" ? occurrences : undefined,
    } as RecurrenceSettings);
    onClose();
  };

  const weekdays = t("planner:dashboard.weekdays_short", {
    returnObjects: true,
  });
  // Reorder from [Mon...Sun] to [Sun, Mon...Sat]
  const days = Array.isArray(weekdays)
    ? [weekdays[6], ...weekdays.slice(0, 6)]
    : ["Zo", "Ma", "Di", "Wo", "Do", "Vr", "Za"];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-obsidian-950 border border-indigo-500/30 w-full max-w-md mx-4 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-indigo-500/5">
          <div className="flex items-center gap-2">
            <RotateCw size={18} className="text-indigo-400" />
            <h3 className="text-white font-bold">
              {t("planner:dashboard.recurrence.title")}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Frequency & Interval */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t("planner:dashboard.recurrence.repeat_every")}
            </label>
            <div className="flex gap-3">
              <input
                type="number"
                min="1"
                max="99"
                value={interval}
                onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
                className="w-16 px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-white text-center focus:border-indigo-500 outline-none"
              />
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as any)}
                className="flex-1 px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:border-indigo-500 outline-none cursor-pointer"
              >
                <option value="daily" className="bg-[#0f172a] text-white">
                  {t("planner:dashboard.recurrence.daily")}
                </option>
                <option value="weekly" className="bg-[#0f172a] text-white">
                  {t("planner:dashboard.recurrence.weekly")}
                </option>
                <option value="monthly" className="bg-[#0f172a] text-white">
                  {t("planner:dashboard.recurrence.monthly")}
                </option>
              </select>
            </div>
          </div>

          {/* Weekly Days Selection */}
          {frequency === "weekly" && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {t("planner:dashboard.recurrence.on_days")}
              </label>
              <div className="flex justify-between gap-1">
                {days.map((day, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleDayToggle(idx)}
                    className={`w-10 h-10 rounded-full text-xs font-bold transition-all
                                            ${selectedDays.includes(idx)
                        ? "bg-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.4)]"
                        : "bg-black/30 text-slate-500 hover:bg-black/50 hover:text-white"
                      }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* End Condition */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t("planner:dashboard.recurrence.ends")}
            </label>
            <div className="space-y-2">
              {/* Count Option */}
              <label className="flex items-center gap-3 p-3 rounded-lg border border-white/5 bg-black/20 cursor-pointer hover:bg-black/40 transition-colors">
                <input
                  type="radio"
                  name="endType"
                  checked={endType === "count"}
                  onChange={() => setEndType("count")}
                  className="accent-indigo-500"
                />
                <span className="text-sm text-slate-300 flex-1">
                  {t("planner:dashboard.recurrence.after_count")}
                </span>
                {endType === "count" && (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      value={occurrences}
                      onChange={(e) =>
                        setOccurrences(parseInt(e.target.value) || 1)
                      }
                      className="w-16 px-2 py-1 bg-black/50 border border-white/10 rounded text-white text-center text-sm"
                    />
                    <span className="text-xs text-slate-500">
                      {t("planner:dashboard.recurrence.occurrences")}
                    </span>
                  </div>
                )}
              </label>

              {/* Date Option */}
              <label className="flex items-center gap-3 p-3 rounded-lg border border-white/5 bg-black/20 cursor-pointer hover:bg-black/40 transition-colors">
                <input
                  type="radio"
                  name="endType"
                  checked={endType === "date"}
                  onChange={() => setEndType("date")}
                  className="accent-indigo-500"
                />
                <span className="text-sm text-slate-300 flex-1">
                  {t("planner:dashboard.recurrence.on_date")}
                </span>
                {endType === "date" && (
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-2 py-1 bg-black/50 border border-white/10 rounded text-white text-sm [color-scheme:dark]"
                  />
                )}
              </label>
            </div>
          </div>

          <button
            onClick={handleSave}
            className="
                group relative w-full py-4 rounded-xl overflow-hidden 
                bg-white/5 border border-indigo-500/30 backdrop-blur-3xl
                text-white font-bold transition-all duration-300
                hover:scale-[1.02] active:scale-[0.98] 
                hover:border-indigo-500/60 hover:shadow-[0_0_30px_rgba(99,102,241,0.2)]
                flex items-center justify-center gap-2
            "
          >
            <div className="absolute inset-0 bg-indigo-500/5 group-hover:bg-indigo-500/10 transition-colors" />
            <Check size={18} className="relative z-10" />
            <span className="relative z-10">{t("planner:dashboard.recurrence.save")}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
