import { AlertTriangle, Timer } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

interface ExamTimerProps {
  minutes: number;
  onTimeUp: () => void;
  isActive: boolean;
}

export const ExamTimer: React.FC<ExamTimerProps> = ({
  minutes,
  onTimeUp,
  isActive,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(minutes * 60);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasEndedRef = useRef(false);

  useEffect(() => {
    if (!isActive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          if (!hasEndedRef.current) {
            hasEndedRef.current = true;
            onTimeUp();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, onTimeUp]);

  // Format time
  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const timeString = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  // Color based on remaining time
  const getColor = (): string => {
    const percentRemaining = secondsRemaining / (minutes * 60);
    if (percentRemaining > 0.5) return "text-emerald-400";
    if (percentRemaining > 0.25) return "text-amber-400";
    return "text-red-400";
  };

  const isWarning = secondsRemaining <= 60;

  return (
    <div
      className={`
      fixed top-4 right-4 z-50 
      bg-gray-900/95 backdrop-blur-sm 
      rounded-xl border border-gray-700 
      px-4 py-3 shadow-2xl
      ${isWarning ? "border-red-500 animate-pulse" : ""}
    `}
    >
      <div className="flex items-center gap-3">
        {isWarning ? (
          <AlertTriangle className="w-5 h-5 text-red-400 animate-bounce" />
        ) : (
          <Timer className="w-5 h-5 text-gray-400" />
        )}

        <span className={`font-mono text-2xl font-bold ${getColor()}`}>
          {timeString}
        </span>
      </div>

      {isWarning && (
        <p className="text-xs text-red-300 mt-1 text-center">Nog 1 minuut!</p>
      )}
    </div>
  );
};
