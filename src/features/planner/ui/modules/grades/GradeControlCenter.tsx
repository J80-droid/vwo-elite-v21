import { motion } from "framer-motion";
import { ArrowRight, ArrowUpDown, Calendar, TrendingUp } from "lucide-react";
import React from "react";

interface GradeControlCenterProps {
  selectedSubject: string;
  subjects: string[];
  onSubjectChange: (val: string) => void;
  sortBy: "date" | "grade";
  onSortByChange: (val: "date" | "grade") => void;
  sortOrder: "asc" | "desc";
  onSortOrderToggle: () => void;
}

export const GradeControlCenter: React.FC<GradeControlCenterProps> = ({
  selectedSubject,
  subjects,
  onSubjectChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderToggle,
}) => {
  return (
    <div className="flex items-center gap-2 bg-black/60 border border-white/10 p-1 rounded-full shadow-2xl">
      {/* Subject Selector */}
      <div className="relative pl-4 pr-2 border-r border-white/10 group">
        <div className="flex flex-col">
          <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest leading-none mb-0.5 group-hover:text-indigo-400 transition-colors">
            Target
          </span>
          <div className="relative flex items-center gap-2">
            <select
              value={selectedSubject}
              onChange={(e) => onSubjectChange(e.target.value)}
              className="appearance-none bg-transparent text-[11px] font-black text-white focus:outline-none cursor-pointer hover:text-indigo-300 transition-colors uppercase w-24 z-10"
            >
              {subjects.map((s) => (
                <option
                  key={s}
                  value={s}
                  className="bg-obsidian-900 text-white"
                >
                  {s === "All" ? "Global.view" : s}
                </option>
              ))}
            </select>
            <div className="absolute right-0 pointer-events-none text-slate-600">
              <ArrowRight size={10} className="rotate-90" />
            </div>
          </div>
        </div>
      </div>

      {/* Sort Mode Pills */}
      <div className="flex items-center bg-white/5 rounded-full p-0.5 border border-white/5">
        {[
          { id: "date", label: "Chron", icon: Calendar },
          { id: "grade", label: "Perf", icon: TrendingUp },
        ].map((mode) => (
          <button
            key={mode.id}
            onClick={() => onSortByChange(mode.id as "date" | "grade")}
            className={`relative flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 group ${sortBy === mode.id ? "text-white" : "text-slate-500 hover:text-slate-300"} `}
            title={mode.label}
          >
            {sortBy === mode.id && (
              <motion.div
                layoutId="sortHighlight"
                className="absolute inset-0 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <mode.icon size={12} className="relative z-10" />
          </button>
        ))}
      </div>

      {/* Order Toggle */}
      <button
        onClick={onSortOrderToggle}
        className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300 ${
          sortOrder === "desc"
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            : "bg-rose-500/10 border-rose-500/30 text-rose-400 hover:shadow-[0_0_15px_rgba(244,63,94,0.3)]"
        } `}
      >
        <ArrowUpDown
          size={12}
          className={`transition-transform duration-500 ${sortOrder === "desc" ? "rotate-0" : "rotate-180"}`}
        />
      </button>
    </div>
  );
};
