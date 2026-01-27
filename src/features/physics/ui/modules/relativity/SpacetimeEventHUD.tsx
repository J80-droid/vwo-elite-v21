import { MapPin } from "lucide-react";
import React from "react";

import {
  lorentzTransform,
  spacetimeInterval,
  useRelativityEngine,
} from "./useRelativityEngine";

export const SpacetimeEventHUD: React.FC = () => {
  const { events, beta } = useRelativityEngine();

  // Take first 3 events for display
  const displayEvents = events.slice(0, 3);

  return (
    <div className="p-4 bg-black/20 backdrop-blur-xl rounded-2xl border border-white/5 shadow-xl">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="w-4 h-4 text-amber-400" />
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Spacetime Events
        </span>
      </div>

      {/* Event List */}
      <div className="space-y-3">
        {displayEvents.map((event) => {
          const transformed = lorentzTransform(event.x, event.t, beta);
          const interval = spacetimeInterval(event.x, event.t);
          const intervalType =
            interval > 0
              ? "timelike"
              : interval < 0
                ? "spacelike"
                : "lightlike";

          return (
            <div
              key={event.id}
              className="p-2 bg-white/5 rounded-lg border border-white/5"
            >
              {/* Event Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: event.color }}
                  />
                  <span className="text-sm font-bold text-white">
                    {event.label}
                  </span>
                </div>
                <span
                  className={`text-[8px] uppercase font-bold px-1.5 py-0.5 rounded ${
                    intervalType === "timelike"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : intervalType === "spacelike"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-amber-500/20 text-amber-400"
                  }`}
                >
                  {intervalType}
                </span>
              </div>

              {/* Coordinates Grid */}
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                {/* Frame S */}
                <div className="flex flex-col">
                  <span className="text-slate-500 font-bold uppercase">
                    Frame S
                  </span>
                  <span className="font-mono text-slate-300">
                    x = {event.x.toFixed(2)}
                  </span>
                  <span className="font-mono text-slate-300">
                    ct = {event.t.toFixed(2)}
                  </span>
                </div>

                {/* Frame S' */}
                <div className="flex flex-col">
                  <span className="text-rose-400 font-bold uppercase">
                    Frame S'
                  </span>
                  <span className="font-mono text-rose-300">
                    x' = {transformed.x.toFixed(2)}
                  </span>
                  <span className="font-mono text-rose-300">
                    ct' = {transformed.t.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Interval */}
              <div className="mt-2 pt-2 border-t border-white/5 flex justify-between items-center">
                <span className="text-[9px] text-slate-500">
                  s² = (ct)² - x²
                </span>
                <span className="font-mono text-[10px] text-white">
                  {interval.toFixed(2)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Total Events Counter */}
      {events.length > 3 && (
        <div className="mt-3 text-center text-[9px] text-slate-500">
          +{events.length - 3} more events
        </div>
      )}
    </div>
  );
};
