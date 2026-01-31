import { ModuleStageProps } from "@features/math/types";
import { GymRepository } from "@shared/api/repositories/GymRepository";
import { useGymProgress } from "@shared/hooks/useGymProgress";
import {
  Atom,
  BookA,
  Calculator,
  Dna,
  FlaskConical,
  Gavel,
  Globe,
  History,
  LineChart,
  Scroll,
  Trophy,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { GYM_CATALOG } from "./config/gymCatalog";
import { GymEngineCard } from "./GymEngineCard";
import { GymSession } from "./GymSession";
import { getEngine } from "./registry";
import { SessionConfigModal } from "./SessionConfigModal";
import { GymUtils } from "./utils/GymUtils";

export const GymStage: React.FC<ModuleStageProps> = () => {
  const { stats, loading } = useGymProgress();
  const { submodule: activeSession } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<string>("all");
  const [selectedEngine, setSelectedEngine] = useState<{
    id: string;
    title: string;
  } | null>(null);

  // Added local state for fast mastery lookup
  const [masteryLevels, setMasteryLevels] = useState<Record<string, number>>(
    {},
  );

  useEffect(() => {
    let isMounted = true;
    const fetchMastery = async () => {
      try {
        const levels = await GymRepository.getSyllabusLevels();
        if (isMounted && levels) {
          const map: Record<string, number> = {};
          levels.forEach((l) => {
            map[l.engine_id] = GymUtils.calculateMastery(l.box_level);
          });
          setMasteryLevels(map);
        }
      } catch (e) {
        console.error("Failed to load lightweight mastery stats", e);
      }
    };
    fetchMastery();
    return () => {
      isMounted = false;
    };
  }, []);

  const questionCount = parseInt(searchParams.get("n") || "10");

  if (activeSession) {
    const engine = getEngine(activeSession);
    if (!engine) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-slate-400">
          <h2 className="text-xl font-bold text-white mb-2">
            Module niet gevonden
          </h2>
          <p>De engine '{activeSession}' is nog niet geregistreerd.</p>
          <button
            onClick={() => navigate("/math-modern/gym")}
            className="mt-4 px-4 py-2 bg-slate-800 rounded-lg"
          >
            Terug
          </button>
        </div>
      );
    }
    return (
      <GymSession
        engineId={activeSession}
        engine={engine}
        onExit={() => navigate("/math-modern/gym")}
        questionCount={questionCount}
      />
    );
  }

  const handleStartSession = (count: number) => {
    if (selectedEngine) {
      navigate(`/math-modern/gym/${selectedEngine.id}?n=${count}`);
      setSelectedEngine(null);
    }
  };

  const getDifficulty = (engineId: string) => {
    return GymUtils.getDifficulty(stats.levels, engineId);
  };

  const getMastery = (engineId: string) => {
    if (engineId.startsWith("mix-")) return 0; // Configurable?
    return masteryLevels[engineId] || 0;
  };

  const filteredCatalog = GYM_CATALOG.filter((item) => {
    if (activeTab === "all") return true;
    return item.category === activeTab;
  });

  return (
    <div className="h-full w-full overflow-y-auto p-4 md:p-8 relative selection:bg-emerald-500/30 custom-scrollbar">
      <div className="max-w-7xl mx-auto pb-32 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-2">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                Gymnasium
              </span>
            </h1>
            <p className="text-slate-400 font-medium max-w-lg">
              Train je cognitieve vaardigheden met adaptieve algoritmes.
            </p>
          </div>

          {/* Stats Summary */}
          <div className="flex gap-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center min-w-[100px]">
              <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest">
                Streak
              </span>
              <div className="flex items-center gap-1 text-amber-400">
                <History size={16} />
                <span className="text-xl font-black">2</span>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center min-w-[100px]">
              <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest">
                XP
              </span>
              <div className="flex items-center gap-1 text-emerald-400">
                <Trophy size={16} />
                <span className="text-xl font-black">
                  {loading ? "..." : (stats.xp / 1000).toFixed(1)}k
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-12">
          {[
            { id: "all", label: "Alles", icon: Globe },
            { id: "math", label: "Wiskunde", icon: Calculator },
            { id: "physics", label: "Natuurkunde", icon: Atom },
            { id: "biology", label: "Biologie", icon: Dna },
            { id: "chemistry", label: "Scheikunde", icon: FlaskConical },
            { id: "economics", label: "Economie", icon: LineChart },
            { id: "history", label: "Geschiedenis", icon: Scroll },
            { id: "english", label: "Engels", icon: BookA },
            { id: "french", label: "Frans", icon: BookA },
            { id: "dutch", label: "Nederlands", icon: Gavel },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold transition-all border ${activeTab === tab.id ? "bg-white text-black border-white" : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10"}`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {filteredCatalog.map((engine) => (
            <GymEngineCard
              key={engine.id}
              id={engine.id}
              title={engine.title}
              description={engine.description}
              themeColor={engine.themeColor}
              icon={
                <engine.icon
                  size={32}
                  className={engine.isSpecial ? "text-amber-500" : ""}
                />
              }
              difficulty={getDifficulty(engine.id)}
              mastery={getMastery(engine.id)}
              onClick={() =>
                setSelectedEngine({ id: engine.id, title: engine.title })
              }
            />
          ))}
        </div>
      </div>

      <SessionConfigModal
        isOpen={!!selectedEngine}
        title={selectedEngine?.title || ""}
        onClose={() => setSelectedEngine(null)}
        onSelect={handleStartSession}
      />
    </div>
  );
};
