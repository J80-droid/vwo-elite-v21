import React, { useEffect, useState } from "react";

interface MasteryRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  theme?: string; // e.g. "text-emerald-400"
  trackColor?: string;
}

export const MasteryRing: React.FC<MasteryRingProps> = ({
  percentage,
  size = 120,
  strokeWidth = 8,
  theme = "text-blue-500",
  trackColor = "text-white/5",
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animate to target percentage
    const timeout = setTimeout(() => {
      setProgress(percentage);
    }, 300);
    return () => clearTimeout(timeout);
  }, [percentage]);

  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        className="w-full h-full transform -rotate-90"
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className={trackColor}
        />
        {/* Progress */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`transition-all duration-[1500ms] ease-out ${theme}`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center flex-col">
        <span className={`text-3xl font-black ${theme} drop-shadow-lg`}>
          {progress}%
        </span>
      </div>
    </div>
  );
};
