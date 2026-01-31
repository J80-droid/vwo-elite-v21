import { MeshViewer } from "@shared/ui/components/MeshViewer";
import { motion } from "framer-motion";
import { ArrowRight, BrainCircuit, type LucideIcon, Network, Sparkles } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";

interface AIModule {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  modelUrl: string;
  color: string;
  bg: string;
  border: string;
  hover: string;
  delay: number;
}

const AICard = ({ module, onSelect }: { module: AIModule; onSelect: (id: string) => void }) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: module.delay }}
      onClick={() => onSelect(module.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative p-8 rounded-3xl border ${module.border} ${module.bg} backdrop-blur-sm text-left transition-all duration-300 hover:-translate-y-1 ${module.hover} overflow-hidden h-full w-full`}
    >
      {/* 3D Diorama Backdrop */}
      <div className="absolute top-0 right-0 w-40 h-40 opacity-40 group-hover:opacity-80 transition-opacity pointer-events-none translate-x-10 -translate-y-4">
        {isHovered ? (
          <MeshViewer url={module.modelUrl} autoRotate shadows={false} />
        ) : (
          <div className="w-full h-full flex items-center justify-center opacity-10">
            <module.icon size={64} className={module.color} />
          </div>
        )}
      </div>

      <div className="mb-6 p-4 rounded-2xl bg-black/20 w-fit relative z-10">
        <module.icon size={32} className={module.color} />
      </div>

      <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors relative z-10">
        {module.title}
      </h3>

      <p className="text-sm text-slate-400 leading-relaxed mb-8 relative z-10">
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
  );
};

export const AILabHub: React.FC = () => {
  const navigate = useNavigate();

  const handleSelect = (moduleId: string) => {
    navigate(`/ailab/${moduleId}`);
  };

  const modules = [
    {
      id: "prompt-eng",
      title: "Neural Forge",
      description:
        "Master prompt engineering en verken LLM capabilities direct in de interface.",
      icon: Sparkles,
      modelUrl: "models/ai/neural_brain.glb",
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
      hover: "group-hover:border-purple-500/50",
      delay: 0.1,
    },
    {
      id: "architecture",
      title: "Neural Architect",
      description:
        "Ontwerp en visualiseer neurale netwerken en AI architecturen.",
      icon: Network,
      modelUrl: "models/ai/logic_gate.glb",
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/20",
      hover: "group-hover:border-cyan-500/50",
      delay: 0.2,
    },
    {
      id: "dashboard",
      title: "Neural Dashboard",
      description:
        "Live status van alle 14 Elite intelligentie systemen.",
      icon: Sparkles,
      modelUrl: "models/ai/neural_brain.glb",
      color: "text-electric",
      bg: "bg-electric/10",
      border: "border-electric/20",
      hover: "group-hover:border-electric/50",
      delay: 0.3,
    },
  ];

  return (
    <div className="flex-1 h-full overflow-y-auto custom-scrollbar p-8 md:p-12">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight uppercase">
            AI{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
              Lab
            </span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl font-light">
            De toekomst van intelligentie. Experimenteer met LLM's en neurale
            netwerken.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => (
            <AICard key={module.id} module={module} onSelect={handleSelect} />
          ))}

          {/* Coming Soon Card */}
          <div className="p-8 rounded-3xl border border-white/5 bg-white/5 backdrop-blur-sm flex flex-col items-center justify-center text-center opacity-50">
            <BrainCircuit size={48} className="text-slate-600 mb-4" />
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
              <h4 className="text-lg font-bold text-white">System Status</h4>
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full w-[100%] bg-gradient-to-r from-purple-500 to-cyan-500 animate-pulse" />
              </div>
              <div className="flex justify-between text-xs text-slate-500 font-mono mt-1">
                <span>SYSTEM ONLINE</span>
                <span>GEMINI 1.5 PRO CONNECTED</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
