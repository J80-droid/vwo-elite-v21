/* eslint-disable react-hooks/immutability */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  getScenarioPlanSQL,
  saveScenarioPlanSQL,
} from "@shared/api/sqliteService";
import {
  getAllStudies,
  getSavedStudies,
  Study,
} from "@shared/api/studyDatabaseService";
import { AlertTriangle, RefreshCw, Target } from "lucide-react";
import React, { useEffect, useState } from "react";

export const ScenarioPlanner: React.FC = () => {
  // const { t } = useTranslation('career');
  const [savedStudies, setSavedStudies] = useState<any[]>([]);
  const [planA, setPlanA] = useState<Study | null>(null);
  const [planB, setPlanB] = useState<Study | null>(null);
  const [planC, setPlanC] = useState<Study | null>(null);
  const [suggestions, setSuggestions] = useState<Study[]>([]);

  useEffect(() => {
    const load = async () => {
      const saved = await getSavedStudies();
      const all = getAllStudies();
      // Hydrate saved studies with full data
      const fullSaved = saved
        .map((s) => all.find((fs) => fs.id === s.study_id))
        .filter(Boolean) as Study[];
      setSavedStudies(fullSaved);

      // Load saved scenario
      const scenario = await getScenarioPlanSQL();
      if (scenario) {
        // Re-hydrate full study objects
        if (scenario.planA) {
          const fullPlanA = all.find((s) => s.id === scenario.planA.id);
          if (fullPlanA) {
            setPlanA(fullPlanA);
            generateSuggestions(fullPlanA);
          }
        }
        if (scenario.planB)
          setPlanB(
            all.find((s) => s.id === scenario.planB.id) || scenario.planB,
          );
        if (scenario.planC)
          setPlanC(
            all.find((s) => s.id === scenario.planC.id) || scenario.planC,
          );
      }
    };
    load();
  }, []);

  // Auto-save on changes
  useEffect(() => {
    if (planA || planB || planC) {
      saveScenarioPlanSQL({ planA, planB, planC });
    }
  }, [planA, planB, planC]);

  const handleSetPlanA = (study: Study) => {
    setPlanA(study);
    generateSuggestions(study);
    setPlanB(null); // Reset lower plans on A change? Or keep? Reset seems safer to force re-eval.
    setPlanC(null);
  };

  const generateSuggestions = (sourceStudy: Study) => {
    const all = getAllStudies();
    // Simple logic: Same sector, but NO Numerus Fixus (if Plan A has it), or just different institution
    const suggestions = all.filter(
      (s) =>
        s.id !== sourceStudy.id &&
        s.sectors.some((sec) => sourceStudy.sectors.includes(sec)) &&
        (!sourceStudy.numerusFixus || !s.numerusFixus), // Ideally Find non-fixus alternatives
    );
    setSuggestions(suggestions.slice(0, 5));
  };

  return (
    <div className="min-h-screen bg-black/90 font-outfit text-white p-8">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            Scenario Planning
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Een VWO-diploma is geen garantie. Wat als je{" "}
            <strong>uitgeloot</strong> wordt? Of je eindexamen net niet haalt?
            Bouw een waterdicht Plan B.
          </p>
        </div>

        {/* The Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connecting Line */}
          <div className="hidden md:block absolute top-12 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500/50 via-amber-500/50 to-slate-500/50 -z-10" />

          {/* Plan A */}
          <div className="space-y-4">
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-6 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-20">
                <Target size={64} className="text-emerald-500" />
              </div>
              <h2 className="text-xl font-bold text-emerald-400 mb-4 flex items-center gap-2">
                <span className="bg-emerald-500 text-black w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                  A
                </span>
                Het Droomdoel
              </h2>

              {planA ? (
                <div className="bg-emerald-500/20 p-4 rounded-xl border border-emerald-500/20">
                  <div className="font-bold text-lg">{planA.name}</div>
                  <div className="text-emerald-300 text-sm">
                    {planA.institution}
                  </div>
                  {planA.numerusFixus && (
                    <div className="mt-2 flex items-center gap-2 text-amber-400 text-xs font-bold uppercase bg-amber-500/10 py-1 px-2 rounded">
                      <AlertTriangle size={12} /> Numerus Fixus (Risico!)
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-slate-500 text-sm italic">
                  Selecteer je favoriete studie uit je favorieten hieronder.
                </div>
              )}
            </div>
          </div>

          {/* Plan B */}
          <div className="space-y-4">
            <div
              className={`transition-all duration-500 border p-6 rounded-2xl relative overflow-hidden ${planA ? "bg-amber-500/10 border-amber-500/30 opacity-100" : "bg-white/5 border-white/10 opacity-50"}`}
            >
              <h2 className="text-xl font-bold text-amber-400 mb-4 flex items-center gap-2">
                <span className="bg-amber-500 text-black w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                  B
                </span>
                Het Vangnet
              </h2>
              <p className="text-sm text-slate-400 mb-4">
                Dezelfde richting, maar{" "}
                <span className="text-white font-bold">zonder loting</span> of
                in een andere stad.
              </p>

              {planB ? (
                <div className="bg-amber-500/20 p-4 rounded-xl border border-amber-500/20 relative group">
                  <div className="font-bold text-lg">{planB.name}</div>
                  <div className="text-amber-300 text-sm">
                    {planB.institution}
                  </div>
                  <button
                    onClick={() => setPlanB(null)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-black/20 rounded"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
              ) : (
                planA && (
                  <div className="space-y-2">
                    {suggestions.slice(0, 3).map((s: Study) => (
                      <button
                        key={s.id}
                        onClick={() => setPlanB(s)}
                        className="w-full text-left p-3 hover:bg-amber-500/20 rounded-lg border border-transparent hover:border-amber-500/30 transition-all text-sm"
                      >
                        <div className="font-bold">{s.name}</div>
                        <div className="text-slate-400 text-xs">
                          {s.institution}
                        </div>
                      </button>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>

          {/* Plan C */}
          <div className="space-y-4">
            <div
              className={`transition-all duration-500 border p-6 rounded-2xl relative overflow-hidden ${planB ? "bg-slate-500/10 border-slate-500/30 opacity-100" : "bg-white/5 border-white/10 opacity-50"}`}
            >
              <h2 className="text-xl font-bold text-slate-300 mb-4 flex items-center gap-2">
                <span className="bg-slate-500 text-black w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                  C
                </span>
                De Switch
              </h2>
              <p className="text-sm text-slate-500 mb-4">
                Wat als je het even niet meer weet? Een tussenjaar of HBO?
              </p>
              {planC ? (
                <div className="bg-slate-500/20 p-4 rounded-xl border border-slate-500/20 relative group">
                  <div className="font-bold text-lg">{planC.name}</div>
                  <div className="text-slate-300 text-sm">
                    {planC.institution}
                  </div>
                  <button
                    onClick={() => setPlanC(null)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-black/20 rounded"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
              ) : (
                planB && (
                  <div className="space-y-2">
                    {suggestions.slice(3, 5).map((s: Study) => (
                      <button
                        key={s.id}
                        onClick={() => setPlanC(s)}
                        className="w-full text-left p-3 hover:bg-slate-500/20 rounded-lg border border-transparent hover:border-slate-500/30 transition-all text-sm"
                      >
                        <div className="font-bold">{s.name}</div>
                        <div className="text-slate-400 text-xs">
                          {s.institution}
                        </div>
                      </button>
                    ))}
                    <button
                      onClick={() =>
                        setPlanC({
                          id: "gap",
                          name: "Tussenjaar",
                          institution: "Reizen & Werken",
                        } as any)
                      }
                      className="w-full text-left p-3 hover:bg-slate-500/20 rounded-lg border border-transparent hover:border-slate-500/30 transition-all text-sm font-bold text-slate-300"
                    >
                      ✈️ Tussenjaar nemen
                    </button>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        {/* Selection Source */}
        <div className="pt-12 border-t border-white/10">
          <h3 className="text-lg font-bold text-slate-400 mb-6">
            Jouw Favorieten (Kies Plan A)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {savedStudies.map((study: Study) => (
              <button
                key={study.id}
                onClick={() => handleSetPlanA(study)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  planA?.id === study.id
                    ? "bg-emerald-500/20 border-emerald-500 ring-2 ring-emerald-500/20"
                    : "bg-white/5 border-white/10 hover:border-white/30"
                }`}
              >
                <div className="font-bold truncate">{study.name}</div>
                <div className="text-sm text-slate-500 truncate">
                  {study.institution}
                </div>
              </button>
            ))}
            {savedStudies.length === 0 && (
              <div className="col-span-4 text-center text-slate-500 py-8">
                Je hebt nog geen studies opgeslagen in de Explorer. Ga eerst
                naar de Explorer om favorieten te kiezen.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
