import { ExamModule } from "@shared/types/exam";
import { Activity, Brain, Sparkles } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";

import { useExamContext } from "../../hooks/ExamContext";
import { ModuleCard } from "./ModuleCard";

export const DashboardPlaceholder: React.FC = () => {
  const { setActiveModule } = useExamContext();
  const navigate = useNavigate();

  const handleModuleClick = (id: ExamModule) => {
    setActiveModule(id);
    navigate(`/examen-centrum/${id}`);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-start gap-12 max-w-6xl mx-auto py-20 px-8 overflow-y-auto custom-scrollbar">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
          <Sparkles size={12} />
          <span>Elite Learning System</span>
        </div>
        <h1 className="text-5xl font-black text-white uppercase tracking-tighter lg:text-7xl">
          Examen{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
            Centrum
          </span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto font-light">
          Optimaliseer je examenprestaties met onze gespecialiseerde modules.
          Kies een focusgebied om direct te beginnen met trainen.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        <ModuleCard
          id="simulator"
          title="Simulator"
          description="Oefen volledige examens in een realistische omgeving."
          icon={Activity}
          color="from-blue-500 to-cyan-400"
          onClick={handleModuleClick}
        />
        <ModuleCard
          id="trainer"
          title="Knowledge Trainer"
          description="Versterk je basiskennis met gerichte AI-coaching."
          icon={Brain}
          color="from-purple-500 to-indigo-400"
          onClick={handleModuleClick}
        />
        <ModuleCard
          id="quiz"
          title="Oefen Quiz"
          description="Genereer korte quizzes over specifieke onderwerpen."
          icon={Sparkles}
          color="from-amber-500 to-orange-400"
          onClick={handleModuleClick}
        />
      </div>
    </div>
  );
};
