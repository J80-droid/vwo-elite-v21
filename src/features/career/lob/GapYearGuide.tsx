import {
  getGapYearPlanSQL,
  saveGapYearPlanSQL,
} from "@shared/api/sqliteService";
import {
  FINANCIAL_SCENARIOS,
  GAP_PROGRAMS,
  GapProgram,
  MONTHS,
} from "@shared/assets/data/gapYearData";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  Briefcase,
  Calculator,
  Calendar,
  CheckCircle,
  Coins,
  Globe,
  Heart,
  Map,
  Plane,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { GapYearAdminWizard } from "./GapYearAdminWizard";
import { GapYearGlobe } from "./GapYearGlobe";
import { GapYearMatchmaker } from "./GapYearMatchmaker";

// Back Button Component
const BackButton = () => (
  <Link
    to="/research/career"
    className="fixed top-24 left-8 z-50 p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-slate-400 hover:text-white transition-all"
  >
    <ArrowLeft size={24} />
  </Link>
);

// Types
type Tab =
  | "dashboard"
  | "timeline"
  | "budget"
  | "explore"
  | "admin"
  | "academic";

interface TimelineItem {
  id: string;
  monthIndex: number; // 0-11 corresponding to Sept-Aug
  programId?: string;
  customLabel?: string;
  type:
    | "travel"
    | "work"
    | "study"
    | "volunteer"
    | "program"
    | "academic"
    | "other";
}

export const GapYearGuide: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [plan, setPlan] = useState<string[]>([]); // Array of program IDs
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [showMatchmaker, setShowMatchmaker] = useState(false);
  const [exploreView, setExploreView] = useState<"list" | "globe">("list");

  // Budget State
  const [budget, setBudget] = useState({
    savings: 2000,
    support: 100, // Monthly
    costs: 0,
  });

  // Load data
  useEffect(() => {
    const load = async () => {
      const saved = await getGapYearPlanSQL();
      if (saved.modules && saved.modules.length > 0) setPlan(saved.modules);
      if (saved.budget) setBudget(saved.budget);
    };
    load();
  }, []);

  const toggleProgram = (id: string) => {
    let newPlan = [...plan];
    if (newPlan.includes(id)) {
      newPlan = newPlan.filter((p) => p !== id);
    } else {
      newPlan.push(id);
    }
    setPlan(newPlan);
    saveGapYearPlanSQL(newPlan, budget); // Pass budget too
  };

  // Auto-save budget changes
  useEffect(() => {
    // debounce saving budget
    const timer = setTimeout(() => {
      saveGapYearPlanSQL(plan, budget);
    }, 1000);
    return () => clearTimeout(timer);
  }, [budget, plan]);

  const addToTimeline = (program: GapProgram, monthIndex: number) => {
    const newItem: TimelineItem = {
      id: crypto.randomUUID(),
      monthIndex,
      programId: program.id,
      customLabel: program.title,
      type: program.type,
    };
    setTimeline([...timeline, newItem]);
  };

  const removeFromTimeline = (id: string) => {
    setTimeline(timeline.filter((t) => t.id !== id));
  };

  const applyHybridTemplate = () => {
    // Clear timeline
    const newTimeline: TimelineItem[] = [];

    // Sept-Dec: Work (Generic)
    [0, 1, 2, 3].forEach((m) => {
      newTimeline.push({
        id: crypto.randomUUID(),
        monthIndex: m,
        customLabel: "Werken & Sparen",
        type: "work",
      });
    });

    // Jan-Mar: Travel (Generic)
    [4, 5, 6].forEach((m) => {
      newTimeline.push({
        id: crypto.randomUUID(),
        monthIndex: m,
        customLabel: "Reizen",
        type: "travel",
      });
    });

    // Apr-Jun: Academic (Generic)
    [7, 8, 9].forEach((m) => {
      newTimeline.push({
        id: crypto.randomUUID(),
        monthIndex: m,
        customLabel: "Proefstuderen",
        type: "academic",
      });
    });

    setTimeline(newTimeline);
    setActiveTab("timeline");
  };

  const applyScenario = (scenarioId: string) => {
    const scenario = FINANCIAL_SCENARIOS.find((s) => s.id === scenarioId);
    if (scenario) {
      setBudget({
        savings: scenario.savings,
        support: scenario.support,
        costs: 0, // Will clearly separate inputs
      });
      // Note: Ideally we would also set standard income/costs fields if UI supported them separately
    }
  };

  const calculateTotalCost = () => {
    let total = 0;
    plan.forEach((id) => {
      const prog = GAP_PROGRAMS.find((p) => p.id === id);
      if (prog) total += prog.costEstimate;
    });
    return total;
  };

  const getTabIcon = (key: Tab) => {
    switch (key) {
      case "dashboard":
        return <Briefcase size={16} />;
      case "explore":
        return <Globe size={16} />;
      case "timeline":
        return <Calendar size={16} />;
      case "budget":
        return <Calculator size={16} />;
      case "admin":
        return <ShieldCheck size={16} />;
      case "academic":
        return <BookOpen size={16} />;
    }
  };

  return (
    <div className="min-h-screen bg-black/90 font-outfit text-white p-6 md:p-8">
      <BackButton />
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent">
              Gap Year Master Plan 2026
            </h1>
            <p className="text-slate-400">
              Ontwerp jouw ultieme tussenjaar. Strategisch, financieel &
              administratief waterproof.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 overflow-x-auto max-w-full">
            {(
              [
                "dashboard",
                "explore",
                "timeline",
                "budget",
                "admin",
                "academic",
              ] as Tab[]
            ).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wide transition-all whitespace-nowrap border ${
                  activeTab === tab
                    ? "bg-blue-500/10 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                    : "border-transparent text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {getTabIcon(tab)}
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {/* --- DASHBOARD TAB --- */}
          {activeTab === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {/* Summary Card */}
              <div className="bg-gradient-to-br from-blue-900/40 to-slate-900 border border-white/10 p-6 rounded-2xl col-span-1 md:col-span-2">
                <h2 className="text-2xl font-bold mb-4">Jouw Status</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-black/30 p-4 rounded-xl text-center">
                    <div className="text-slate-400 text-xs uppercase font-bold mb-1">
                      Mijn Plan
                    </div>
                    <div className="text-3xl font-black text-white">
                      {plan.length}
                    </div>
                    <div className="text-xs text-slate-500">Activiteiten</div>
                  </div>
                  <div className="bg-black/30 p-4 rounded-xl text-center">
                    <div className="text-slate-400 text-xs uppercase font-bold mb-1">
                      Budget Nodig
                    </div>
                    <div className="text-3xl font-black text-white">
                      €{calculateTotalCost()}
                    </div>
                    <div className="text-xs text-slate-500">
                      Excl. levensonderhoud
                    </div>
                  </div>
                  <div className="bg-black/30 p-4 rounded-xl text-center">
                    <div className="text-slate-400 text-xs uppercase font-bold mb-1">
                      Admin Check
                    </div>
                    <div className="text-sm font-bold text-emerald-400 bg-emerald-500/10 py-2 rounded mt-1">
                      Start Wizard
                    </div>
                  </div>
                </div>

                {plan.length === 0 ? (
                  <div className="mt-8 text-center p-8 border border-dashed border-white/10 rounded-xl">
                    <Globe className="mx-auto mb-2 opacity-50" />
                    <p className="text-slate-400">
                      Je hebt nog geen programma's gekozen.
                    </p>
                    <button
                      onClick={() => setActiveTab("explore")}
                      className="mt-4 px-6 py-2 bg-blue-500/10 border border-blue-500/50 text-blue-400 hover:bg-blue-500/20 rounded-lg font-bold shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-all"
                    >
                      Start met verkennen &rarr;
                    </button>
                    <button
                      onClick={() => setShowMatchmaker(true)}
                      className="mt-4 ml-4 px-6 py-2 bg-purple-500/10 border border-purple-500/50 text-purple-400 hover:bg-purple-500/20 rounded-lg font-bold shadow-[0_0_15px_rgba(168,85,247,0.2)] transition-all"
                    >
                      Doe de Quiz &rarr;
                    </button>
                  </div>
                ) : (
                  <div className="mt-6 space-y-2">
                    <h3 className="text-sm font-bold text-slate-400 uppercase">
                      Gekozen Programma's
                    </h3>
                    {plan.map((id) => {
                      const p = GAP_PROGRAMS.find((prog) => prog.id === id);
                      if (!p) return null;
                      return (
                        <div
                          key={id}
                          className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5"
                        >
                          <div className="flex items-center gap-3">
                            {getIcon(p.type)}
                            <span>{p.title}</span>
                          </div>
                          <span className="text-sm text-slate-400">
                            €{p.costEstimate}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Tips Card */}
              <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Briefcase size={20} className="text-emerald-400" /> Decaan
                  Advies 2026
                </h2>
                <ul className="space-y-4 text-sm text-slate-300">
                  <li className="flex gap-3">
                    <span className="font-bold text-emerald-400">1.</span>
                    <span className="flex-1">
                      <strong>8-Maanden Regel:</strong> Ga je langer dan 8
                      maanden weg? Uitschrijven BRP is verplicht.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-emerald-400">2.</span>
                    <span className="flex-1">
                      <strong>Proefstuderen:</strong> Blokkeer maart/april voor
                      meeloopdagen.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-emerald-400">3.</span>
                    <span className="flex-1">
                      <strong>Financieel:</strong> Een tussenjaar in 2026 kost
                      gemiddeld €5k - €10k. Begin op tijd.
                    </span>
                  </li>
                </ul>
                <button
                  onClick={() => applyHybridTemplate()}
                  className="w-full mt-6 py-3 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/50 rounded-xl font-bold text-sm transition-all"
                >
                  Laad "Hybride Model" Sjabloon
                </button>
              </div>
            </motion.div>
          )}

          {/* --- EXPLORE & ACADEMIC TAB (Reusing List View) --- */}
          {(activeTab === "explore" || activeTab === "academic") && (
            <motion.div
              key="explore"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* View Toggles (Only for Explore, not Academic) */}
              {activeTab === "explore" && (
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 relative z-10">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Globe className="text-blue-400" />
                    Ontdek Programma's
                  </h2>
                  <div className="bg-white/10 p-1.5 rounded-xl border border-white/20 flex gap-1 shadow-lg shadow-black/50">
                    <button
                      onClick={() => setExploreView("list")}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${exploreView === "list" ? "bg-blue-500 text-white shadow-lg" : "text-slate-300 hover:text-white hover:bg-white/5"}`}
                    >
                      LIJST
                    </button>
                    <button
                      onClick={() => setExploreView("globe")}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${exploreView === "globe" ? "bg-blue-500 text-white shadow-lg" : "text-slate-300 hover:text-white hover:bg-white/5"}`}
                    >
                      3D GLOBE
                    </button>
                  </div>
                </div>
              )}

              {exploreView === "globe" && activeTab === "explore" ? (
                <GapYearGlobe />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {GAP_PROGRAMS.filter((p) =>
                    activeTab === "academic"
                      ? p.type === "academic"
                      : p.type !== "academic",
                  ).map((prog) => (
                    <div
                      key={prog.id}
                      className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors group"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-white/5 rounded-xl text-blue-400 group-hover:scale-110 transition-transform">
                          {getIcon(prog.type)}
                        </div>
                        <button
                          onClick={() => toggleProgram(prog.id)}
                          className={`p-2 rounded-full transition-colors ${plan.includes(prog.id) ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-slate-500 hover:text-white"}`}
                        >
                          {plan.includes(prog.id) ? (
                            <CheckCircle size={20} />
                          ) : (
                            <Plus size={20} />
                          )}
                        </button>
                      </div>
                      <h3 className="text-xl font-bold mb-1">{prog.title}</h3>
                      <div className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">
                        {prog.organization}
                      </div>
                      <p className="text-sm text-slate-400 mb-4 h-12 line-clamp-2">
                        {prog.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-500 mb-4">
                        <span className="flex items-center gap-1">
                          <Coins size={12} /> €{prog.costEstimate}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={12} /> {prog.durationWeeks} wkn
                        </span>
                        <span className="flex items-center gap-1">
                          <Map size={12} /> {prog.locations[0]}
                        </span>
                      </div>
                      {prog.requirements && (
                        <div className="mt-2 pt-2 border-t border-white/5">
                          <div className="text-[10px] uppercase font-bold text-slate-600 mb-1">
                            Eisen
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {prog.requirements.map((r) => (
                              <span
                                key={r}
                                className="px-1.5 py-0.5 bg-white/5 rounded text-[10px] text-slate-400"
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* --- ADMIN WIZARD --- */}
          {activeTab === "admin" && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex justify-center items-start pt-10"
            >
              <GapYearAdminWizard />
            </motion.div>
          )}

          {/* --- TIMELINE TAB --- */}
          {activeTab === "timeline" && (
            <motion.div
              key="timeline"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white/5 border border-white/10 rounded-3xl p-8 overflow-x-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold">Jouw Jaarplanning</h2>
                <button
                  onClick={applyHybridTemplate}
                  className="text-xs font-bold text-blue-400 hover:text-white uppercase tracking-wider"
                >
                  Reset naar Hybrid Template
                </button>
              </div>

              <div className="min-w-[800px] grid grid-cols-12 gap-2">
                {/* Header Months */}
                {MONTHS.map((m) => (
                  <div
                    key={m}
                    className="text-center text-xs font-bold uppercase text-slate-500 mb-4"
                  >
                    {m}
                  </div>
                ))}

                {/* Slots */}
                {MONTHS.map((_, idx) => (
                  <div
                    key={idx}
                    className="h-64 border-l border-white/5 relative group bg-white/[0.02]"
                  >
                    {/* Hover Add Button */}
                    <button
                      onClick={() => addToTimeline(GAP_PROGRAMS[0]!, idx)} // Demo adds generic
                      className="absolute top-2 left-2 p-1.5 bg-blue-500/10 border border-blue-500/50 text-blue-400 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-500/20 hover:shadow-[0_0_10px_rgba(59,130,246,0.5)] z-20"
                    >
                      <Plus size={12} />
                    </button>

                    {/* Render Items */}
                    {timeline
                      .filter((t) => t.monthIndex === idx)
                      .map((item) => (
                        <div
                          key={item.id}
                          className={`absolute top-10 left-1 w-[280%] z-10 border p-2 rounded-lg text-xs shadow-lg backdrop-blur-md truncate cursor-pointer hover:scale-105 transition-all ${item.type === "work" ? "bg-emerald-500/10 border-emerald-500 text-emerald-100 shadow-[0_0_10px_rgba(16,185,129,0.2)]" : item.type === "travel" ? "bg-blue-500/10 border-blue-500 text-blue-100 shadow-[0_0_10px_rgba(59,130,246,0.2)]" : "bg-purple-500/10 border-purple-500 text-purple-100 shadow-[0_0_10px_rgba(168,85,247,0.2)]"}`}
                        >
                          <div className="font-bold">{item.customLabel}</div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFromTimeline(item.id);
                            }}
                            className="absolute -top-1 -right-1 bg-red-500/10 border border-red-500 text-red-400 rounded-full p-0.5 hover:bg-red-500/20 transition-colors"
                          >
                            <Trash2 size={8} />
                          </button>
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* --- BUDGET TAB --- */}
          {activeTab === "budget" && (
            <motion.div
              key="budget"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Scenario Selectors */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {FINANCIAL_SCENARIOS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => applyScenario(s.id)}
                    className="text-left p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all hover:border-blue-500/50 group"
                  >
                    <div className="text-xs font-bold text-slate-500 uppercase mb-1">
                      Scenario {s.id}
                    </div>
                    <div className="font-bold text-lg mb-1 group-hover:text-blue-400 font-outfit">
                      {s.title}
                    </div>
                    <div className="text-xs text-slate-400 leading-relaxed">
                      {s.description}
                    </div>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Calculator */}
                <div className="bg-white/5 border border-white/10 p-8 rounded-3xl space-y-6">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Calculator /> Financiële Check
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                        Startkapitaal (Sparen)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-3 text-slate-500">
                          €
                        </span>
                        <input
                          type="number"
                          value={budget.savings}
                          onChange={(e) =>
                            setBudget({
                              ...budget,
                              savings: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-full bg-black/30 border border-white/10 rounded-lg p-3 pl-8 text-white focus:border-blue-500 outline-none transition-colors"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                        Ouderbijdrage (per maand)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-3 text-slate-500">
                          €
                        </span>
                        <input
                          type="number"
                          value={budget.support}
                          onChange={(e) =>
                            setBudget({
                              ...budget,
                              support: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-full bg-black/30 border border-white/10 rounded-lg p-3 pl-8 text-white focus:border-blue-500 outline-none transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/10 text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">
                        Totaal Inkomsten (12 mnd)
                      </span>
                      <span className="text-emerald-400 font-bold">
                        + €{budget.savings + budget.support * 12}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">
                        Programmakosten (Gekozen Items)
                      </span>
                      <span className="text-red-400 font-bold">
                        - €{calculateTotalCost()}
                      </span>
                    </div>
                    <div className="flex justify-between opacity-50">
                      <span className="text-slate-400">
                        Geschat Levensonderhoud (Ref)
                      </span>
                      <span className="text-red-400">~ €2000</span>
                    </div>

                    <div className="flex justify-between text-xl font-bold pt-4 border-t border-white/10 mt-4">
                      <span>Beschikbaar voor Leven/Reizen</span>
                      <span
                        className={
                          budget.savings +
                            budget.support * 12 -
                            calculateTotalCost() >=
                          0
                            ? "text-emerald-400"
                            : "text-red-500"
                        }
                      >
                        €
                        {budget.savings +
                          budget.support * 12 -
                          calculateTotalCost()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Advice Box */}
                <div className="flex flex-col gap-6">
                  <div className="bg-gradient-to-br from-emerald-900/20 to-slate-900 border border-emerald-500/20 p-8 rounded-3xl flex flex-col justify-center items-center text-center flex-1">
                    <Coins size={64} className="text-emerald-500/50 mb-6" />
                    <h3 className="text-xl font-bold text-white mb-2">
                      Advies
                    </h3>
                    <p className="text-slate-400 text-sm max-w-xs">
                      {budget.savings +
                        budget.support * 12 -
                        calculateTotalCost() >
                      5000
                        ? "Sterk plan! Je hebt voldoende buffer voor onvoorziene kosten en leuke dingen."
                        : "Krap budget. Overweeg fase 1 (sept-dec) fulltime te werken om je reisbudget te vergroten."}
                    </p>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                    <h4 className="font-bold text-slate-400 text-xs uppercase mb-2">
                      Vergeten kosten?
                    </h4>
                    <ul className="text-sm text-slate-500 space-y-1 list-disc list-inside">
                      <li>Vaccinaties (Gele koorts, etc.) ~€300</li>
                      <li>Visumkosten (Australië ~€350)</li>
                      <li>Reisverzekering (Globetrotter) ~€600/jaar</li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Matchmaker Modal */}
        <AnimatePresence>
          {showMatchmaker && (
            <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <GapYearMatchmaker onClose={() => setShowMatchmaker(false)} />
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Helper for icons
function getIcon(type: string) {
  switch (type) {
    case "travel":
      return <Plane size={24} />;
    case "work":
      return <Briefcase size={24} />;
    case "school":
    case "academic":
    case "study":
      return <BookOpen size={24} />;
    case "volunteer":
      return <Heart size={24} />;
    case "program":
      return <Globe size={24} />;
    default:
      return <Map size={24} />;
  }
}
