/* eslint-disable @typescript-eslint/no-explicit-any */
import { useTranslations } from "@shared/hooks/useTranslations";
import { AnimatePresence, motion } from "framer-motion";
import {
  Cpu,
  Database,
  HeartPulse,
  LucideIcon,
  ScanFace,
  Smartphone,
  User,
} from "lucide-react";
import { useState } from "react";

// --- TYPES ---
interface TechUpgrade {
  id: string;
  icon: LucideIcon;
  name: string;
  type: "internal" | "external" | "cognitive";
  impact: {
    haraway: string;
    clark: string;
    plessner: string;
  };
}

// --- DATA: Merged from CyborgSim & TechnoLab ---
const UPGRADES: TechUpgrade[] = [
  {
    id: "external-memory",
    icon: Smartphone,
    name: "Smartphone (Memory)",
    type: "external",
    impact: {
      haraway:
        "Een extensie van het zelf; de grens tussen machine en mens vervaagt.",
      clark:
        'Onderdeel van de "Extended Mind"; de telefoon is letterlijk een deel van je cognitie.',
      plessner:
        'Bevestigt de mens als "van nature kunstmatig" wezen dat tools nodig heeft.',
    },
  },
  {
    id: "pacemaker",
    icon: HeartPulse,
    name: "Intelligente Pacemaker",
    type: "internal",
    impact: {
      haraway: "Het ultieme bewijs voor de cyborg: we zijn al hybrides.",
      clark: "Een functionele koppeling die essentieel is voor het systeem.",
      plessner:
        "Een technische noodzaak om het excentrische leven te behouden.",
    },
  },
  {
    id: "neural-link",
    icon: Cpu,
    name: "Neural Interface",
    type: "cognitive",
    impact: {
      haraway:
        "Ontmanteling van het liberale subject; we worden collectieve intelligentie.",
      clark: "De ultieme integratie van de Extended Mind.",
      plessner:
        'Risico op verlies van de "excentrische afstand" als techniek te intiem wordt.',
    },
  },
];

export const TechnoAnthropologyLab = () => {
  const { t } = useTranslations();
  const [activeUpgrades, setActiveUpgrades] = useState<string[]>([]);
  const [selectedPhilosopher, setSelectedPhilosopher] = useState<
    "haraway" | "clark" | "plessner"
  >("haraway");

  const toggleUpgrade = (id: string) => {
    if (activeUpgrades.includes(id)) {
      setActiveUpgrades(activeUpgrades.filter((u) => u !== id));
    } else {
      setActiveUpgrades([...activeUpgrades, id]);
    }
  };

  const getCyborgPercentage = () => {
    return Math.min(100, activeUpgrades.length * 33);
  };

  return (
    <div className="w-full h-full flex flex-col p-8 gap-8 bg-black overflow-y-auto">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <ScanFace size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">
              {t("philosophy.techno_anthropology.title")}
            </h2>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">
              {t("philosophy.techno_anthropology.subtitle")}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-[500px]">
        {/* LINKS: De Mens (Visualizer) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white/[0.02] rounded-[3rem] border border-white/5 relative overflow-hidden min-h-[450px] flex flex-col items-center justify-center p-12 group">
            {/* Achtergrond Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.1),transparent)]" />

            {/* Het Silhouet */}
            <div
              className={`relative transition - all duration - 700 ${activeUpgrades.length > 0 ? "scale-110" : "scale-100"} `}
            >
              <User
                className={`w - 64 h - 64 transition - colors duration - 500 ${activeUpgrades.length > 2 ? "text-cyan-400 drop-shadow-[0_0_40px_rgba(34,211,238,0.4)]" : "text-slate-700"} `}
              />

              {/* Overlay Icons op het lichaam */}
              <AnimatePresence>
                {activeUpgrades.includes("neural-link") && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute top-4 left-1/2 -translate-x-1/2"
                  >
                    <Cpu className="text-cyan-300 animate-pulse" size={32} />
                  </motion.div>
                )}
                {activeUpgrades.includes("pacemaker") && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute top-24 left-1/2 -translate-x-1/2"
                  >
                    <HeartPulse
                      className="text-rose-400 animate-pulse"
                      size={32}
                    />
                  </motion.div>
                )}
                {activeUpgrades.includes("external-memory") && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute top-32 -right-8"
                  >
                    <Smartphone className="text-blue-400" size={32} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Status Bar */}
            <div className="absolute bottom-10 left-10 right-10">
              <div className="flex justify-between text-[10px] uppercase font-black tracking-[0.2em] mb-3">
                <span className="text-slate-600">
                  {t("philosophy.techno_anthropology.bio_organic")}
                </span>
                <span className="text-cyan-400">
                  {t("philosophy.techno_anthropology.techno_cyborg")}
                </span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${getCyborgPercentage()}% ` }}
                  className="h-full bg-gradient-to-r from-blue-600 to-cyan-400"
                />
              </div>
              <div className="mt-4 text-center font-black text-cyan-400 text-xs tracking-[0.3em] uppercase italic">
                {t("philosophy.techno_anthropology.cyborg_index")}:{" "}
                {getCyborgPercentage()}%
              </div>
            </div>
          </div>

          {/* Upgrade Knoppen */}
          <div className="grid grid-cols-3 gap-4">
            {UPGRADES.map((upgrade) => {
              const Icon = upgrade.icon;
              const isActive = activeUpgrades.includes(upgrade.id);
              return (
                <button
                  key={upgrade.id}
                  onClick={() => toggleUpgrade(upgrade.id)}
                  className={`p - 6 rounded - 2xl border flex flex - col items - center gap - 3 transition - all duration - 300 ${
                    isActive
                      ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-300 shadow-[0_0_30px_rgba(34,211,238,0.15)] scale-[1.05]"
                      : "bg-white/5 border-white/5 text-slate-500 hover:border-white/20 hover:text-slate-300"
                  } `}
                >
                  <Icon size={24} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-center">
                    {upgrade.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* RECHTS: De Filosofische Analyse */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="bg-white/[0.02] rounded-[3rem] border border-white/5 flex-1 flex flex-col overflow-hidden backdrop-blur-3xl">
            {/* Filosoof Tabs */}
            <div className="flex border-b border-white/5 bg-white/[0.02]">
              {[
                {
                  id: "haraway",
                  label: "Donna Haraway",
                  sub: "Cyborg Manifesto",
                },
                {
                  id: "clark",
                  label: "Clark & Chalmers",
                  sub: "Extended Mind",
                },
                {
                  id: "plessner",
                  label: "Helmuth Plessner",
                  sub: "Excentriciteit",
                },
              ].map((philo) => (
                <button
                  key={philo.id}
                  onClick={() => setSelectedPhilosopher(philo.id as any)}
                  className={`flex - 1 p - 6 text - left transition - all relative ${
                    selectedPhilosopher === philo.id
                      ? "bg-white/5"
                      : "text-slate-600 hover:text-slate-400"
                  } `}
                >
                  {selectedPhilosopher === philo.id && (
                    <motion.div
                      layoutId="philo-tab"
                      className="absolute bottom-0 left-0 right-0 h-1 bg-cyan-500"
                    />
                  )}
                  <div
                    className={`text - sm font - black uppercase tracking - tight ${selectedPhilosopher === philo.id ? "text-white" : ""} `}
                  >
                    {philo.label}
                  </div>
                  <div className="text-[9px] uppercase tracking-widest font-bold opacity-40 mt-1">
                    {philo.sub}
                  </div>
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div className="p-10 flex-1 overflow-y-auto">
              <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-8 flex items-center gap-3">
                <Database className="text-slate-700" size={24} />
                {t("philosophy.techno_anthropology.body_ontology")}
              </h3>

              <AnimatePresence mode="wait">
                {activeUpgrades.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center h-64 text-slate-600 italic"
                  >
                    <User size={48} className="mb-4 opacity-10" />
                    <p className="text-xs font-black uppercase tracking-widest">
                      {t("philosophy.techno_anthropology.initial_state")}
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key={selectedPhilosopher + activeUpgrades.length}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="space-y-6"
                  >
                    {UPGRADES.filter((u) => activeUpgrades.includes(u.id)).map(
                      (u) => {
                        const Icon = u.icon;
                        return (
                          <div
                            key={u.id}
                            className="bg-white/[0.03] p-6 rounded-[2rem] border-l-4 border-cyan-500/50 hover:bg-white/[0.05] transition-colors relative overflow-hidden group"
                          >
                            <div className="absolute top-0 right-0 p-6 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                              <Icon size={64} />
                            </div>
                            <div className="flex items-center gap-3 mb-4 text-cyan-400 font-black text-[10px] uppercase tracking-[0.2em]">
                              <Icon size={16} /> {u.name}
                            </div>
                            <p className="text-lg text-slate-200 leading-relaxed font-light italic relative z-10">
                              "{u.impact[selectedPhilosopher]}"
                            </p>
                          </div>
                        );
                      },
                    )}

                    {/* Conclusie Blok */}
                    <div className="mt-12 p-8 rounded-[2rem] bg-gradient-to-br from-indigo-950/40 to-cyan-950/40 border border-white/10 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-white">
                        <ScanFace size={100} />
                      </div>
                      <div className="text-[10px] uppercase tracking-[0.4em] text-indigo-400 font-black mb-4">
                        Synthese & Conclusie
                      </div>
                      <p className="text-xl text-white font-light leading-relaxed relative z-10">
                        {/* Fallback synthesis content since we removed the t() dependency for Plessner */}
                        {selectedPhilosopher === "haraway" &&
                          "We kunnen niet terug naar een 'pure' natuur. De cyborg is onze ontologie."}
                        {selectedPhilosopher === "clark" &&
                          "De geest stopt niet bij de schedel. Techniek is het weefsel van ons denken."}
                        {selectedPhilosopher === "plessner" &&
                          "De mens is van nature kunstmatig. We zijn 'excentrisch': altijd buiten onszelf via techniek."}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
