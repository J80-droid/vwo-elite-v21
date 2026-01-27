/* eslint-disable @typescript-eslint/no-explicit-any */
import { DataService } from "@shared/api/DataService";
import { OpenDay } from "@shared/types/lob.types";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, Clock, ExternalLink, Plus } from "lucide-react";
import React, { useEffect, useState } from "react";

export const OpenDaysAgenda: React.FC = () => {
  const [filter, setFilter] = useState<"All" | "On-Campus" | "Online">("All");
  const [registered, setRegistered] = useState<string[]>([]);
  const [openDays, setOpenDays] = useState<OpenDay[]>([]);

  useEffect(() => {
    const load = async () => {
      const days = (await DataService.getOpenDays()) as OpenDay[];
      setOpenDays(days);

      // Check persistence
      const registeredIds = [];
      for (const day of days) {
        const isRegistered = await DataService.hasRelatedTask(day.id);
        if (isRegistered) registeredIds.push(day.id);
      }
      setRegistered(registeredIds);
    };
    load();
  }, []);

  const filteredDays = openDays
    .filter((d) => filter === "All" || d.type === filter)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const toggleRegistration = async (dayId: string) => {
    if (registered.includes(dayId)) return;

    const day = openDays.find((d) => d.id === dayId);
    if (!day) return;

    try {
      // Save to Planner DB
      await DataService.addTask({
        id: crypto.randomUUID(),
        title: `Open Dag: ${day.institution}`,
        date: new Date(day.date).getTime(),
        type: "study", // Default to study type
        completed: false,
        related_id: dayId,
      });

      setRegistered((prev) => [...prev, dayId]);
    } catch (error) {
      console.error("Failed to add to agenda", error);
    }
  };

  return (
    <div className="min-h-screen bg-black/90 font-outfit text-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
              Open Dagen Agenda
            </h1>
            <p className="text-slate-400 mt-1">
              Plan je bezoeken en oriënteer je op de toekomst.
              <button
                onClick={() =>
                  window.open("/research/career/gap-year", "_self")
                }
                className="ml-2 text-emerald-400 font-bold hover:underline"
              >
                Of neem een tussenjaar?
              </button>
            </p>
          </div>

          <div className="flex bg-white/5 p-1 rounded-xl">
            {["All", "On-Campus", "Online"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === f
                    ? "bg-white/10 text-blue-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {f === "All" ? "Alles" : f}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredDays.map((day) => (
              <motion.div
                key={day.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 group hover:border-blue-500/30 transition-all hover:bg-white/[0.07]"
              >
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Date Box */}
                  <div className="flex-shrink-0 w-full md:w-24 bg-white/5 rounded-xl flex flex-row md:flex-col items-center justify-center p-4 border border-white/5 group-hover:border-blue-500/20 transition-colors">
                    <div className="text-sm font-bold text-blue-400 uppercase tracking-wider">
                      {new Date(day.date).toLocaleDateString("nl-NL", {
                        month: "short",
                      })}
                    </div>
                    <div className="text-3xl font-bold text-white ml-3 md:ml-0">
                      {new Date(day.date).getDate()}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                          {day.institution}
                        </h3>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 mt-1">
                          <span className="flex items-center gap-1.5">
                            <Clock size={14} className="text-slate-500" />
                            {day.time}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium border ${
                              day.type === "On-Campus"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                            }`}
                          >
                            {day.type}
                          </span>
                        </div>
                      </div>
                      <a
                        href={day.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-white/10 rounded-lg text-slate-500 hover:text-white transition-colors"
                      >
                        <ExternalLink size={20} />
                      </a>
                    </div>

                    <p className="text-slate-300 text-sm leading-relaxed">
                      {day.description}
                    </p>

                    <div className="pt-2">
                      <button
                        onClick={() => toggleRegistration(day.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all border ${
                          registered.includes(day.id)
                            ? "bg-blue-500/10 border-blue-500/50 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                            : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/30 hover:text-white"
                        }`}
                      >
                        {registered.includes(day.id) ? (
                          <>
                            <CheckCircle size={16} />
                            Toegevoegd aan Agenda
                          </>
                        ) : (
                          <>
                            <Plus size={16} />
                            In Agenda zetten
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
