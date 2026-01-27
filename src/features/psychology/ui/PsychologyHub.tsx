import { motion } from "framer-motion";
import { Activity, ArrowRight, Brain, Fingerprint, Users } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";

export const PsychologyHub: React.FC = () => {
  const navigate = useNavigate();

  const modules = [
    {
      id: "cognition",
      title: "Cognitie & Geheugen",
      description:
        "Experimenteer met geheugenmodellen, aandachtstesten en cognitieve processen.",
      icon: Activity,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      hover: "group-hover:border-amber-500/50",
      delay: 0.1,
    },
    {
      id: "social",
      title: "Sociale Psychologie",
      description:
        "Simuleer groepsdynamiek, conformisme en sociale beïnvloeding.",
      icon: Users,
      color: "text-rose-400",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
      hover: "group-hover:border-rose-500/50",
      delay: 0.2,
    },
    {
      id: "personality",
      title: "Persoonlijkheid",
      description:
        "Analyseer persoonlijkheidskenmerken (Big Five) en individuele verschillen.",
      icon: Fingerprint,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/20",
      hover: "group-hover:border-indigo-500/50",
      delay: 0.3,
    },
  ];

  return (
    <div className="flex-1 h-full overflow-y-auto custom-scrollbar p-8 md:p-12">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight uppercase">
            Psychologie{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-rose-500">
              Lab
            </span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl font-light">
            Verken de menselijke geest. Kies een domein om experimenten en
            simulaties te starten.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => (
            <motion.button
              key={module.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: module.delay }}
              onClick={() => navigate(`/psychology/${module.id}`)}
              className={`group relative p-8 rounded-3xl border ${module.border} ${module.bg} backdrop-blur-sm text-left transition-all duration-300 hover:-translate-y-1 ${module.hover}`}
            >
              <div className="mb-6 p-4 rounded-2xl bg-black/20 w-fit">
                <module.icon size={32} className={module.color} />
              </div>

              <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">
                {module.title}
              </h3>

              <p className="text-sm text-slate-400 leading-relaxed mb-8">
                {module.description}
              </p>

              <div
                className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest ${module.color} opacity-60 group-hover:opacity-100 transition-opacity`}
              >
                Start Module{" "}
                <ArrowRight
                  size={14}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </div>
            </motion.button>
          ))}
        </div>

        {/* Info Block */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="p-8 rounded-3xl bg-white/5 border border-white/10"
        >
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 space-y-2">
              <h4 className="text-lg font-bold text-white">Lab Status</h4>
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full w-[40%] bg-gradient-to-r from-amber-500 to-rose-500" />
              </div>
              <div className="flex justify-between text-xs text-slate-500 font-mono mt-1">
                <span>ONDERZOEK LOPEND</span>
                <span>3 EXPERIMENTEN ACTIEF</span>
              </div>
            </div>
            <div className="flex gap-12 border-l border-white/10 pl-8">
              <div className="flex items-center gap-3">
                <Brain size={24} className="text-slate-600" />
                <div>
                  <div className="text-xl font-black text-white">Neural</div>
                  <div className="text-[10px] uppercase tracking-widest text-slate-500">
                    Netwerk
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
