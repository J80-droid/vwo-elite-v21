import { ModuleStageProps } from "@features/math/types";
import {
  ArrowLeft,
  Circle,
  Grid,
  Layers,
  Navigation,
  TrendingUp,
  Zap,
} from "lucide-react";
import React from "react";
import { useNavigate, useParams } from "react-router-dom";

import { ConceptCard } from "./ConceptCard";
import { ConceptChain } from "./ConceptChain";
import { ConceptRiemann } from "./ConceptRiemann";
import { ConceptSketcher } from "./ConceptSketcher";
import { ConceptTuner } from "./ConceptTuner";
import { ConceptUnitCircle } from "./ConceptUnitCircle";
import { ConceptVector } from "./ConceptVector";

export const ConceptStage: React.FC<ModuleStageProps> = () => {
  const { submodule: activeConcept } = useParams();
  const navigate = useNavigate();

  // --- ROUTING LOGICA ---

  // 1. Transformatie Tuner (Emerald)
  if (activeConcept === "tuner") {
    return (
      <ConceptLayout
        title="Transformatie Tuner"
        color="text-emerald-500"
        bgTint="bg-emerald-500/5"
        onBack={() => navigate("/math-modern/concepts")}
      >
        <ConceptTuner />
      </ConceptLayout>
    );
  }

  // 2. Kettingregel Ui (Purple)
  if (activeConcept === "chain") {
    return (
      <ConceptLayout
        title="Kettingregel Ui"
        color="text-purple-500"
        bgTint="bg-purple-500/5"
        onBack={() => navigate("/math-modern/concepts")}
      >
        <ConceptChain />
      </ConceptLayout>
    );
  }

  // 3. Helling Schetser (Indigo)
  if (activeConcept === "sketcher") {
    return (
      <ConceptLayout
        title="Helling Schetser"
        color="text-indigo-500"
        bgTint="bg-indigo-500/5"
        onBack={() => navigate("/math-modern/concepts")}
      >
        <ConceptSketcher />
      </ConceptLayout>
    );
  }

  // 4. Sine Weaver / Eenheidscirkel (Cyan)
  if (activeConcept === "unit-circle") {
    return (
      <ConceptLayout
        title="Sine Weaver"
        color="text-cyan-500"
        bgTint="bg-cyan-500/5"
        onBack={() => navigate("/math-modern/concepts")}
      >
        <ConceptUnitCircle />
      </ConceptLayout>
    );
  }

  // 5. Area Architect / Riemann (Amber)
  if (activeConcept === "riemann") {
    return (
      <ConceptLayout
        title="Area Architect"
        color="text-amber-500"
        bgTint="bg-amber-500/5"
        onBack={() => navigate("/math-modern/concepts")}
      >
        <ConceptRiemann />
      </ConceptLayout>
    );
  }

  // 6. Vector Voyager (Blue)
  if (activeConcept === "vector") {
    return (
      <ConceptLayout
        title="Vector Voyager"
        color="text-blue-500"
        bgTint="bg-blue-500/5"
        onBack={() => navigate("/math-modern/concepts")}
      >
        <ConceptVector />
      </ConceptLayout>
    );
  }

  // --- DASHBOARD (Default) ---
  return (
    <div className="h-full w-full overflow-y-auto p-4 md:p-8 relative selection:bg-indigo-500/30">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/5 blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto pb-32 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-16 gap-8 border-b border-white/5 pb-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-1 bg-indigo-500/50 rounded-full" />
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                Visualization Module
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4 flex items-center gap-4">
              The Lab{" "}
              <span className="px-3 py-1 bg-white/5 border border-white/10 text-indigo-400 text-xs rounded-full font-bold tracking-normal uppercase">
                Layer 2
              </span>
            </h2>
            <p className="text-slate-400 max-w-lg text-lg font-medium leading-relaxed">
              Welkom in het Concept Lab. Hier bouwen we mentale modellen. Geen
              sommen stampen, maar de wiskunde{" "}
              <span className="text-white">voelen</span>.
            </p>
          </div>
        </div>

        {/* Concepts Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <ConceptCard
            id="tuner"
            title="Transformatie Tuner"
            description="Master de verschuivingen en uitrekkingen van functies door ze live te tunen."
            icon={<Zap size={32} />}
            domain="Domein B"
            onClick={() => navigate("/math-modern/concepts/tuner")}
          />

          <ConceptCard
            id="sketcher"
            title="Helling Schetser"
            description="Teken de afgeleide direct over de functie. Begrijp helling door te doen."
            icon={<TrendingUp size={32} />}
            domain="Domein C"
            onClick={() => navigate("/math-modern/concepts/sketcher")}
          />

          <ConceptCard
            id="chain"
            title="Kettingregel Ui"
            description="Pel complexe functies af tot de kern. Visualiseer de samenstelling."
            icon={<Layers size={32} />}
            domain="Domein C"
            onClick={() => navigate("/math-modern/concepts/chain")}
          />

          <ConceptCard
            id="unit-circle"
            title="Sine Weaver"
            description="Ontdek de connectie tussen cirkelbeweging en golven. Zie de sinus ontstaan terwijl je draait."
            icon={<Circle size={32} />}
            domain="Domein D"
            onClick={() => navigate("/math-modern/concepts/unit-circle")}
          />

          <ConceptCard
            id="riemann"
            title="Area Architect"
            description="Visualiseer integralen door rechthoeken te stapelen. Zie hoe grove blokjes gladde oppervlakken worden."
            icon={<Grid size={32} />}
            domain="Domein C"
            onClick={() => navigate("/math-modern/concepts/riemann")}
          />

          <ConceptCard
            id="vector"
            title="Vector Voyager"
            description="Vectoren optellen en inproducten visualiseren. Zie hoe de hoek het product naar nul dwingt."
            icon={<Navigation size={32} />}
            domain="Domein E"
            onClick={() => navigate("/math-modern/concepts/vector")}
          />
        </div>
      </div>
    </div>
  );
};

// Internal Layout Helper
interface ConceptLayoutProps {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
  color: string;
  bgTint: string;
}

const ConceptLayout: React.FC<ConceptLayoutProps> = ({
  title,
  onBack,
  children,
  color,
  bgTint,
}) => (
  <div className="h-full flex flex-col bg-obsidian-950">
    <div
      className={`flex-none p-4 border-b border-white/5 flex items-center gap-4 backdrop-blur-md ${bgTint}`}
    >
      <button
        onClick={onBack}
        className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all hover:scale-110 active:scale-90"
      >
        <ArrowLeft size={20} />
      </button>
      <div className="flex flex-col">
        <span
          className={`text-[10px] uppercase font-black tracking-widest ${color}`}
        >
          Concept Lab
        </span>
        <span className="font-bold text-white tracking-tight uppercase">
          {title}
        </span>
      </div>
    </div>
    <div className="flex-1 overflow-hidden">{children}</div>
  </div>
);
