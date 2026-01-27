import React from "react";

interface EliteLoaderProps {
  message?: string;
}

export const EliteLoader: React.FC<EliteLoaderProps> = ({
  message = "Loading Math Engine...",
}) => (
  <div className="flex flex-col items-center justify-center h-full min-h-[100px] space-y-4 animate-in fade-in duration-500">
    <div className="relative w-10 h-10">
      <div className="absolute inset-0 border-2 border-emerald-500/10 rounded-xl" />
      <div className="absolute inset-0 border-2 border-t-emerald-500 rounded-xl animate-spin shadow-[0_0_15px_rgba(16,185,129,0.2)]" />
    </div>
    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-500/60 animate-pulse">
      {message}
    </span>
  </div>
);
