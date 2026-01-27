import { ExamModule } from "@shared/types/exam";
import React from "react";

interface ModuleCardProps {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  onClick: (id: ExamModule) => void;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({
  id,
  title,
  description,
  icon: Icon,
  color,
  onClick,
}) => (
  <button
    onClick={() => onClick(id as ExamModule)}
    className="group relative bg-white/5 border border-white/10 rounded-2xl p-6 text-left transition-all duration-500 hover:bg-white/10 hover:border-white/20 hover:translate-y--1 overflow-hidden"
  >
    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
      <Icon size={120} />
    </div>
    <div className="relative w-12 h-12 rounded-xl flex items-center justify-center mb-4 overflow-hidden border border-white/10 group-hover:border-white/30 transition-colors shadow-[0_0_15px_rgba(0,0,0,0.2)]">
      <div
        className={`absolute inset-0 bg-gradient-to-br ${color} opacity-20 group-hover:opacity-40 transition-opacity duration-500`}
      />
      <Icon
        size={24}
        className="relative z-10 text-white/90 group-hover:text-white group-hover:scale-110 transition-all duration-500"
      />
    </div>
    <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-wide group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/60 transition-all">
      {title}
    </h3>
    <p className="text-slate-400 text-sm leading-relaxed max-w-[200px]">
      {description}
    </p>
    <div className="mt-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-white transition-colors">
      <span>Start Sessie</span>
      <div className="h-0.5 w-4 bg-slate-500 group-hover:bg-white transition-all group-hover:w-8" />
    </div>
  </button>
);
