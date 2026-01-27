import { GymEngineCard, GymSession, SessionConfigModal } from "@features/math";
import { useGymProgress } from "@shared/hooks/useGymProgress";
import {
  Activity,
  ArrowUpRight,
  BookOpen,
  Dices,
  Radiation,
  Scale,
  TrendingUp,
  Zap,
} from "lucide-react";
import React, { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

export const PhysicsGymStage: React.FC = () => {
  const { stats } = useGymProgress();
  const { submodule: activeSession } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [selectedEngine, setSelectedEngine] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const questionCount = parseInt(searchParams.get("n") || "10");

  // Als sessie actief is: render de bestaande GymSession
  // (We hergebruiken de logica, hij laadt straks de juiste Physics Engine via de ID)
  if (activeSession) {
    return (
      <GymSession
        engineId={activeSession}
        onExit={() => navigate("/physics/gym")}
        questionCount={questionCount}
      />
    );
  }

  const handleStartSession = (count: number) => {
    if (selectedEngine) {
      navigate(`/physics/gym/${selectedEngine.id}?n=${count}`);
      setSelectedEngine(null);
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto p-4 md:p-8 relative selection:bg-amber-500/30 font-outfit">
      {/* Physics Theme Background: Amber Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/5 blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto pb-32 relative z-10">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-16 gap-8 border-b border-white/5 pb-12">
          <div className="space-y-4">
            <div className="flex flex-col gap-1 border-l border-amber-500/50 pl-4 py-2 bg-gradient-to-r from-amber-500/10 to-transparent pointer-events-none w-fit">
              <div className="text-[10px] uppercase font-black text-amber-500 tracking-[0.2em]">
                Active Drill Engine
              </div>
              <div className="text-[10px] text-slate-400 font-mono italic">
                "Precision via Automation"
              </div>
            </div>
            <h2 className="text-5xl md:text-6xl font-black text-white uppercase tracking-tighter flex items-center gap-4">
              Physics{" "}
              <span className="text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                Gym
              </span>
            </h2>
            <p className="text-slate-400 max-w-lg text-lg font-medium leading-relaxed opacity-80">
              Natuurkunde vereist "number sense". Automatiseer je eenheden,
              significante cijfers en prefixen.
            </p>
          </div>

          <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4">
            <Activity className="text-amber-500 animate-pulse" size={16} />
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Drill Status: <span className="text-white">Ready</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* SPECIAL: THE PHYSICS MILKSHAKE */}
          <GymEngineCard
            id="mix-physics"
            title="Physics Milkshake"
            description="De ultieme mix. Willekeurige vragen van alle bovenstaande engines. Ben je er klaar voor?"
            icon={<Dices size={32} className="text-amber-500" />}
            difficulty={Math.max(
              1,
              Math.round(
                Object.values(stats.levels || {}).reduce((a, b) => a + b, 0) /
                  (Object.keys(stats.levels || {}).length || 1),
              ),
            )}
            onClick={() =>
              setSelectedEngine({
                id: "mix-physics",
                title: "Physics Milkshake",
              })
            }
          />

          {/* ENGINE 1: UNIT CONVERTER */}
          <GymEngineCard
            id="units"
            title="Prefix Power"
            description="Van nano naar giga. Automatiseer je machten van 10 en eenhedenconversies."
            icon={<Scale size={32} />}
            difficulty={stats.levels?.["units"] || 1}
            onClick={() =>
              setSelectedEngine({ id: "units", title: "Prefix Power" })
            }
          />

          {/* ENGINE 2: SIGFIG POLICE */}
          <GymEngineCard
            id="sigfig"
            title="SigFig Police"
            description="Voorkom puntenaftrek. Train op significantie en decimalen-regels."
            icon={<Activity size={32} />}
            difficulty={stats.levels?.["sigfig"] || 1}
            onClick={() =>
              setSelectedEngine({ id: "sigfig", title: "SigFig Police" })
            }
          />

          {/* ENGINE 3: THE ISOLATOR */}
          <GymEngineCard
            id="isolator"
            title="The Isolator"
            description="Variabelen vrijmaken uit formules zonder getallen in te vullen."
            icon={<Zap size={32} />}
            difficulty={stats.levels?.["isolator"] || 1}
            onClick={() =>
              setSelectedEngine({ id: "isolator", title: "The Isolator" })
            }
          />

          {/* ENGINE 4: VECTOR NINJA */}
          <GymEngineCard
            id="phys-vectors"
            title="Vector Ninja"
            description="Krachten ontbinden zonder na te denken. Sinus of Cosinus? Hellend vlak meesteren."
            icon={<ArrowUpRight size={32} />}
            difficulty={stats.levels?.["phys-vectors"] || 1}
            onClick={() =>
              setSelectedEngine({ id: "phys-vectors", title: "Vector Ninja" })
            }
          />

          {/* ENGINE 5: DECAY BUILDER */}
          <GymEngineCard
            id="decay"
            title="Decay Builder"
            description="Vervalvergelijkingen kloppend maken. Behoud van A en Z."
            icon={<Radiation size={32} />}
            difficulty={stats.levels?.["decay"] || 1}
            onClick={() =>
              setSelectedEngine({ id: "decay", title: "Decay Builder" })
            }
          />

          {/* ENGINE 6: CIRCUIT SNAP */}
          <GymEngineCard
            id="circuits"
            title="Circuit Snap"
            description="Weerstanden in serie en parallel. Vervangingsweerstand uit het hoofd."
            icon={<Zap size={32} />}
            difficulty={stats.levels?.["circuits"] || 1}
            onClick={() =>
              setSelectedEngine({ id: "circuits", title: "Circuit Snap" })
            }
          />

          {/* ENGINE 7: GRAPH READER */}
          <GymEngineCard
            id="graphs"
            title="The Graph Reader"
            description="Helling of Oppervlakte? Koppel wiskunde aan fysieke betekenis."
            icon={<TrendingUp size={32} />}
            difficulty={stats.levels?.["graphs"] || 1}
            onClick={() =>
              setSelectedEngine({ id: "graphs", title: "The Graph Reader" })
            }
          />

          {/* ENGINE 8: DEFINITION DESTROYER */}
          <GymEngineCard
            id="flashcards"
            title="Definition Destroyer"
            description="Vakjargon trainen. Van Foton tot Hoofdreeks."
            icon={<BookOpen size={32} />}
            difficulty={stats.levels?.["flashcards"] || 1}
            onClick={() =>
              setSelectedEngine({
                id: "flashcards",
                title: "Definition Destroyer",
              })
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
