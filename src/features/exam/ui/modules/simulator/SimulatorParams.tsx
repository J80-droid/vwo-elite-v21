import { Clock } from "lucide-react";
import React, { useEffect, useState } from "react";

import { useSimulatorState } from "./useSimulatorState";

export const SimulatorParams: React.FC = () => {
  const { data } = useSimulatorState();
  const [seconds, setSeconds] = useState(0);
  const [prevSimState, setPrevSimState] = useState(data.simState);

  // Synchronize state during render (React recommended pattern for state-from-props/context)
  if (data.simState !== prevSimState) {
    setPrevSimState(data.simState);
    if (data.simState !== "answering") {
      setSeconds(0);
    }
  }

  useEffect(() => {
    if (data.simState !== "answering") return;

    const interval = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [data.simState]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 justify-between bg-black/20 p-3 rounded-xl border border-white/5">
        <div className="flex items-center gap-2">
          <Clock
            size={16}
            className={
              data.simState === "answering"
                ? "text-rose-400 animate-pulse"
                : "text-slate-500"
            }
          />
          <span
            className={`font-mono text-lg font-bold ${data.simState === "answering" ? "text-rose-200" : "text-slate-500"}`}
          >
            {mins.toString().padStart(2, "0")}:
            {secs.toString().padStart(2, "0")}
          </span>
        </div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
          {data.simState === "idle" ? "Ready" : data.simState}
        </div>
      </div>
    </div>
  );
};
