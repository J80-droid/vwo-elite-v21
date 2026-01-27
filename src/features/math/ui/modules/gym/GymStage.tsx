import { ModuleStageProps } from "@features/math/types";
import { useGymProgress } from "@shared/hooks/useGymProgress";
import {
  ArrowRightLeft,
  ArrowUpRight,
  Circle,
  Dices,
  GitCommit,
  Layers,
  RotateCcw,
  Shapes,
  ShieldCheck,
  Sigma,
  Zap,
} from "lucide-react";
import React, { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { GymEngineCard } from "./GymEngineCard";
import { GymSession } from "./GymSession";
import { SessionConfigModal } from "./SessionConfigModal";

// Main Component
export const GymStage: React.FC<ModuleStageProps> = () => {
  const { stats, loading } = useGymProgress();
  const { submodule: activeSession } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [selectedEngine, setSelectedEngine] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const questionCount = parseInt(searchParams.get("n") || "10");

  // If session is active, render GymSession
  if (activeSession) {
    return (
      <GymSession
        engineId={activeSession}
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

  return (
    <div className="h-full w-full overflow-y-auto p-4 md:p-8 relative selection:bg-emerald-500/30">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto pb-32 relative z-10">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-16 gap-8 border-b border-white/5 pb-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-1 bg-emerald-500/50 rounded-full" />
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                Training Module
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4 flex items-center gap-4">
              The Gym{" "}
              <span className="px-3 py-1 bg-white/5 border border-white/10 text-emerald-400 text-xs rounded-full font-bold tracking-normal uppercase">
                Layer 1
              </span>
            </h2>
            <p className="text-slate-400 max-w-lg text-lg font-medium leading-relaxed">
              Train je basisvaardigheden. Geen inzicht, puur automatisme. Bouw
              je <span className="text-white">muscle memory</span> voor algebra
              en rekenen.
            </p>
          </div>
          {/* Stats Panel - Neon Refined */}
          <div className="flex gap-6">
            <div className="px-6 py-4 bg-white/5 border border-emerald-500/20 rounded-2xl text-right shadow-[0_0_20px_rgba(16,185,129,0.05)] backdrop-blur-md">
              <div className="text-[10px] text-emerald-500/70 uppercase tracking-widest font-black mb-1">
                Total XP
              </div>
              <div className="text-3xl font-black text-white">
                {loading ? "..." : stats.xp.toLocaleString()}
              </div>
            </div>
            <div className="px-6 py-4 bg-white/5 border border-amber-500/20 rounded-2xl text-right shadow-[0_0_20px_rgba(245,158,11,0.05)] backdrop-blur-md">
              <div className="text-[10px] text-amber-500/70 uppercase tracking-widest font-black mb-1">
                Due for Review
              </div>
              <div className="text-3xl font-black text-white">
                {loading ? "..." : stats.dueCount}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* SPECIAL: THE MATH MILKSHAKE */}
          <GymEngineCard
            id="mix-math"
            title="Math Milkshake"
            description="De ultieme mix van algebra, gonio en calculus. Laat zien dat je alles beheerst."
            icon={<Dices size={32} className="text-amber-500" />}
            difficulty={Math.max(
              1,
              Math.round(
                Object.values(stats.levels || {}).reduce((a, b) => a + b, 0) /
                  (Object.keys(stats.levels || {}).length || 1),
              ),
            )}
            onClick={() =>
              setSelectedEngine({ id: "mix-math", title: "Math Milkshake" })
            }
          />

          {/* Engine Card: Fractions */}
          <GymEngineCard
            id="fractions"
            title="Breuken Meesterschap"
            description="Optellen, vermenigvuldigen en vereenvoudigen van complexe breuken."
            icon={<RotateCcw size={32} />}
            difficulty={stats.levels?.["fractions"] || 1}
            onClick={() =>
              setSelectedEngine({
                id: "fractions",
                title: "Breuken Meesterschap",
              })
            }
          />

          {/* Engine Card: Machten */}
          <GymEngineCard
            id="exponents"
            title="Machten Tetris"
            description="Vloeiend worden met exponenten, wortels en de kracht van logaritmen."
            icon={<Zap size={32} />}
            difficulty={stats.levels?.["exponents"] || 1}
            onClick={() =>
              setSelectedEngine({ id: "exponents", title: "Machten Tetris" })
            }
          />

          {/* Engine Card: Goniometrie */}
          <GymEngineCard
            id="trig"
            title="Gonio Sprint"
            description="Exacte waarden van de eenheidscirkel en radialen omrekenen op topsnelheid."
            icon={<Circle size={32} />}
            difficulty={stats.levels?.["trig"] || 1}
            onClick={() =>
              setSelectedEngine({ id: "trig", title: "Goniometrie Sprint" })
            }
          />

          {/* Engine Card: Afgeleiden */}
          <GymEngineCard
            id="derivs"
            title="Afgeleide Dash"
            description="Basisregels voor differentiëren automatiseren tot het tweede natuur is."
            icon={<GitCommit size={32} />}
            difficulty={stats.levels?.["derivs"] || 1}
            onClick={() =>
              setSelectedEngine({ id: "derivs", title: "Afgeleide Dash" })
            }
          />

          {/* Engine Card: Formules */}
          <GymEngineCard
            id="formulas"
            title="Formule Fabriek"
            description="Herken goniometrische identiteiten en factorisatieregels in een oogopslag."
            icon={<Layers size={32} />}
            difficulty={stats.levels?.["formulas"] || 1}
            onClick={() =>
              setSelectedEngine({ id: "formulas", title: "Formule Fabriek" })
            }
          />

          {/* Engine Card: Vectoren */}
          <GymEngineCard
            id="vectors"
            title="Vector Versnelling"
            description="Inproducten, magnitudes en orthogonaliteit berekenen zonder na te denken."
            icon={<ArrowUpRight size={32} />}
            difficulty={stats.levels?.["vectors"] || 1}
            onClick={() =>
              setSelectedEngine({ id: "vectors", title: "Vector Versnelling" })
            }
          />

          {/* Phase 2: Integraal Sprint */}
          <GymEngineCard
            id="integraal"
            title="Integraal Sprint"
            description="Omgekeerd differentiëren. Herken primitieven en rekenregels razendsnel."
            icon={<Sigma size={32} />}
            difficulty={stats.levels?.["integraal"] || 1}
            onClick={() =>
              setSelectedEngine({ id: "integraal", title: "Integraal Sprint" })
            }
          />

          {/* Phase 2: Limieten Launch */}
          <GymEngineCard
            id="limits"
            title="Limieten Launch"
            description="Jaag op asymptoten, gaten en het gedrag in het oneindige."
            icon={<ArrowRightLeft size={32} />}
            difficulty={stats.levels?.["limits"] || 1}
            onClick={() =>
              setSelectedEngine({ id: "limits", title: "Limieten Launch" })
            }
          />

          {/* Phase 2: Domain Defender */}
          <GymEngineCard
            id="domain"
            title="Domain Defender"
            description="Wortels, logaritmen en breuken. Bewaak de grenzen van what mag."
            icon={<ShieldCheck size={32} />}
            difficulty={stats.levels?.["domain"] || 1}
            onClick={() =>
              setSelectedEngine({ id: "domain", title: "Domain Defender" })
            }
          />

          {/* Engine Card: Geometry Recall */}
          <GymEngineCard
            id="geometry"
            title="Geometry Recall"
            description="Stamp parate kennis voor meetkunde: stellingen, eigenschappen en definities."
            icon={<Shapes size={32} />}
            difficulty={stats.levels?.["geometry"] || 1}
            onClick={() =>
              setSelectedEngine({ id: "geometry", title: "Geometry Recall" })
            }
          />
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
