import React from "react";

interface ProgressBarProps {
  progress: number;
  status: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  status,
}) => {
  if (progress <= 0) return null;

  return (
    <div className="max-w-md mx-auto">
      <div className="flex justify-between text-sm mb-2">
        <span className="text-slate-400">{status}</span>
        <span className="text-electric font-mono">{Math.round(progress)}%</span>
      </div>
      <div className="h-2 bg-obsidian-950 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-electric to-electric-glow transition-all duration-200 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
