import { motion } from "framer-motion";
import { ArrowRight, Brain, Lightbulb, Network } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";

export const BrainstormHub: React.FC = () => {
  const navigate = useNavigate();

  const modules = [
    {
      id: "mindmap",
      title: "Mind Mapper",
      description:
        "Visualiseer ideeën en creëer complexe mindmaps voor projecten.",
      icon: Network,
      color: "text-fuchsia-400",
      bg: "bg-fuchsia-500/10",
      border: "border-fuchsia-500/20",
      hover: "group-hover:border-fuchsia-500/50",
      delay: 0.1,
    },
    {
      id: "knowledge",
      title: "Knowledge Base",
      description: "Beheer je notities, bronnen en onderzoeksresultaten.",
      icon: Brain,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
      border: "border-violet-500/20",
      hover: "group-hover:border-violet-500/50",
      delay: 0.2,
    },
  ];

  return (
    <div className="flex-1 h-full overflow-y-auto custom-scrollbar p-8 md:p-12">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight uppercase">
            Brainstorm{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-violet-400">
              Lab
            </span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl font-light">
            Jouw creatieve ruimte. Structureer gedachten en bewaar inzichten.
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
              onClick={() => navigate(`/brainstorm/${module.id}`)}
              className={`group relative p-8 rounded-3xl border ${module.border} ${module.bg} backdrop-blur-sm text-left transition-all duration-300 hover:-translate-y-1 ${module.hover}`}
            >
              <div className="mb-6 p-4 rounded-2xl bg-black/20 w-fit">
                <module.icon size={32} className={module.color} />
              </div>

              <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-fuchsia-400 transition-colors">
                {module.title}
              </h3>

              <p className="text-sm text-slate-400 leading-relaxed mb-8">
                {module.description}
              </p>

              <div
                className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest ${module.color} opacity-60 group-hover:opacity-100 transition-opacity`}
              >
                Start Sessie{" "}
                <ArrowRight
                  size={14}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </div>
            </motion.button>
          ))}

          {/* Coming Soon Card */}
          <div className="p-8 rounded-3xl border border-white/5 bg-white/5 backdrop-blur-sm flex flex-col items-center justify-center text-center opacity-50">
            <Lightbulb size={48} className="text-slate-600 mb-4" />
            <h3 className="text-xl font-bold text-slate-500">
              More Coming Soon
            </h3>
          </div>
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
              <h4 className="text-lg font-bold text-white">Brain Activity</h4>
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full w-[65%] bg-gradient-to-r from-fuchsia-500 to-violet-500" />
              </div>
              <div className="flex justify-between text-xs text-slate-500 font-mono mt-1">
                <span>CREATIVE FLOW STABLE</span>
                <span>2 MODULES ACTIVE</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
