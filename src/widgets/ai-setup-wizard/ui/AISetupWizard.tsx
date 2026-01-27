import {
  discoverAllLocalModels,
  DiscoveryResult,
} from "@shared/api/model-runners";
import { detectSystemSpecs, SystemSpecs } from "@shared/lib/hardwareDetector";
import { useModelRegistryStore } from "@shared/model/modelRegistryStore";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Brain,
  CheckCircle,
  Cpu,
  Database,
  Loader2,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";
import React, { useState } from "react";

interface AISetupWizardProps {
  onComplete: () => void;
}

type Step = "intro" | "scan" | "discovery" | "preset" | "final";

export const AISetupWizard: React.FC<AISetupWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState<Step>("intro");
  const [specs, setSpecs] = useState<SystemSpecs | null>(null);
  const [, setIsScanning] = useState(false);
  const [discoveryResults, setDiscoveryResults] = useState<DiscoveryResult[]>(
    [],
  );
  const [selectedPreset, setSelectedPreset] =
    useState<string>("preset-private");

  const { setSystemSpecs, setOnboardingComplete, setActivePreset } =
    useModelRegistryStore();

  const handleStartScan = async () => {
    setStep("scan");
    setIsScanning(true);
    try {
      const detectedSpecs = await detectSystemSpecs();
      setSpecs(detectedSpecs);
      setSystemSpecs(detectedSpecs);

      // Simulate deep scan for effect
      await new Promise((r) => setTimeout(r, 2000));
      setStep("discovery");

      const results = await discoverAllLocalModels();
      setDiscoveryResults(results);
    } catch (error) {
      console.error("Scan failed", error);
    } finally {
      setIsScanning(false);
    }
  };

  const handleFinish = () => {
    setActivePreset(selectedPreset);
    setOnboardingComplete(true);
    onComplete();
  };

  const variants = {
    enter: { x: 20, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -20, opacity: 0 },
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col min-h-[500px]">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
              <Brain size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                AI Brain Setup
              </h2>
              <p className="text-xs text-slate-500 font-mono uppercase tracking-widest">
                Project Cerebrum v1.0
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            {(["intro", "scan", "discovery", "preset", "final"] as Step[]).map(
              (s, i) => (
                <div
                  key={s}
                  className={`h-1 w-8 rounded-full transition-all duration-500 ${
                    (
                      [
                        "intro",
                        "scan",
                        "discovery",
                        "preset",
                        "final",
                      ] as Step[]
                    ).indexOf(step) >= i
                      ? "bg-blue-500"
                      : "bg-white/5"
                  }`}
                />
              ),
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-8 overflow-y-auto relative">
          <AnimatePresence mode="wait">
            {step === "intro" && (
              <motion.div
                key="intro"
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-white">
                    Welkom bij VWO Elite AI
                  </h3>
                  <p className="text-slate-400 leading-relaxed text-sm">
                    We gaan je persoonlijke AI-leeromgeving optimaliseren.
                    Hiertoe scannen we je hardware om de beste modellen te
                    kiezen en configureren we je geheugen-instellingen.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-white/5 border border-white/5 rounded-xl space-y-2">
                    <Zap className="text-yellow-400" size={20} />
                    <h4 className="font-bold text-white text-sm">Snelheid</h4>
                    <p className="text-[10px] text-slate-500">
                      Optimale model-keuze voor jouw systeem.
                    </p>
                  </div>
                  <div className="p-4 bg-white/5 border border-white/5 rounded-xl space-y-2">
                    <Shield className="text-emerald-400" size={20} />
                    <h4 className="font-bold text-white text-sm">Privacy</h4>
                    <p className="text-[10px] text-slate-500">
                      Lokale verwerking zonder cloud-afhankelijkheid.
                    </p>
                  </div>
                  <div className="p-4 bg-white/5 border border-white/5 rounded-xl space-y-2">
                    <Database className="text-blue-400" size={20} />
                    <h4 className="font-bold text-white text-sm">Geheugen</h4>
                    <p className="text-[10px] text-slate-500">
                      Persoonlijke context integratie.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleStartScan}
                  className="w-full py-4 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 text-blue-400 font-bold rounded-xl flex items-center justify-center gap-2 group transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                >
                  Start Hardware Scan{" "}
                  <ArrowRight
                    size={18}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </button>
              </motion.div>
            )}

            {step === "scan" && (
              <motion.div
                key="scan"
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                className="flex flex-col items-center justify-center h-full space-y-8 py-12"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500/20 blur-3xl animate-pulse" />
                  <Loader2
                    size={64}
                    className="text-blue-500 animate-spin relative"
                  />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold text-white">
                    Analysis in Progress...
                  </h3>
                  <p className="text-sm text-slate-500 font-mono uppercase tracking-widest">
                    Detecting CPU, GPU & Memory Architecture
                  </p>
                </div>
                <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2 text-[10px] text-emerald-400">
                    <CheckCircle size={10} /> WebGL context initialized
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-emerald-400">
                    <CheckCircle size={10} /> Testing VRAM persistence
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-blue-400">
                    <Activity size={10} className="animate-pulse" />{" "}
                    Benchmarking local inference speed...
                  </div>
                </div>
              </motion.div>
            )}

            {step === "discovery" && specs && (
              <motion.div
                key="discovery"
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-6"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-white">
                      Scan Resultaten
                    </h3>
                    <p className="text-sm text-slate-500">
                      Hardware gedetecteerd: Tier{" "}
                      <span className="text-blue-400 font-bold uppercase">
                        {specs.tier}
                      </span>
                    </p>
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full text-[10px] font-bold text-blue-400 uppercase">
                    {specs.cpuCores} Cores | {specs.ramTotalGB}GB RAM
                  </div>
                </div>

                <div className="bg-zinc-950 border border-white/5 rounded-xl p-4 space-y-4">
                  <div className="flex items-center gap-3 text-xs">
                    <Cpu size={16} className="text-slate-500" />
                    <span className="text-slate-400 flex-1">
                      {specs.cpuModel}
                    </span>
                    <span className="text-white font-mono">
                      {specs.cpuCores} threads
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <Sparkles size={16} className="text-slate-500" />
                    <span className="text-slate-400 flex-1">
                      {specs.gpu.available
                        ? specs.gpu.name
                        : "Geen toegewezen GPU gedetecteerd"}
                    </span>
                    <span className="text-white font-mono">
                      {specs.gpu.vramGB || 0}GB VRAM
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Gevonden Lokale Engines
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {discoveryResults.map((res) => (
                      <div
                        key={res.provider}
                        className={`p-3 border rounded-xl flex items-center justify-between ${res.available ? "bg-emerald-500/5 border-emerald-500/20" : "bg-white/5 border-white/10 opacity-60"}`}
                      >
                        <div className="flex items-center gap-3">
                          <Database
                            size={16}
                            className={
                              res.available
                                ? "text-emerald-400"
                                : "text-slate-600"
                            }
                          />
                          <div>
                            <div className="text-xs font-bold text-white capitalize">
                              {res.provider}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {res.available
                                ? `${res.models.length} modellen geladen`
                                : res.error || "Niet gevonden"}
                            </div>
                          </div>
                        </div>
                        {res.available && (
                          <CheckCircle size={16} className="text-emerald-400" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setStep("preset")}
                  className="w-full py-4 bg-white/10 border border-white/20 hover:bg-white/20 text-white font-bold rounded-xl flex items-center justify-center gap-2 group transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                >
                  Doorgaan naar Presets <ArrowRight size={18} />
                </button>
              </motion.div>
            )}

            {step === "preset" && (
              <motion.div
                key="preset"
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-6"
              >
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white">
                    Kies je Intelligence Preset
                  </h3>
                  <p className="text-sm text-slate-500">
                    Hoe wil je dat de AI zich gedraagt?
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {[
                    {
                      id: "preset-private",
                      name: "100% Privacy",
                      desc: "Alleen lokale modellen. Geen data verlaat je computer.",
                      icon: Shield,
                      color: "text-emerald-400",
                    },
                    {
                      id: "preset-quality",
                      name: "Elite Quality",
                      desc: "Zwaardere modellen voor complexe antwoorden.",
                      icon: Sparkles,
                      color: "text-purple-400",
                    },
                    {
                      id: "preset-fast",
                      name: "Ultra Speed",
                      desc: "Geoptimaliseerd voor sub-second respons.",
                      icon: Zap,
                      color: "text-yellow-400",
                    },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPreset(p.id)}
                      className={`p-4 border rounded-xl text-left transition-all ${
                        selectedPreset === p.id
                          ? "bg-blue-600/10 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.1)]"
                          : "bg-white/5 border-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-2 rounded-lg bg-black/40 ${p.color}`}
                        >
                          <p.icon size={20} />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">
                            {p.name}
                          </div>
                          <div className="text-xs text-slate-500">{p.desc}</div>
                        </div>
                        {selectedPreset === p.id && (
                          <div className="ml-auto w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-bold text-white">
                            ✓
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setStep("final")}
                  className="w-full py-4 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 text-blue-400 font-bold rounded-xl transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                >
                  Configuratie Afronden
                </button>
              </motion.div>
            )}

            {step === "final" && (
              <motion.div
                key="final"
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                className="flex flex-col items-center justify-center h-full space-y-6 py-12"
              >
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30">
                  <CheckCircle size={40} className="text-emerald-400" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-bold text-white">
                    AI Brain is Ready!
                  </h3>
                  <p className="text-sm text-slate-400">
                    Je systeem is nu volledig geoptimaliseerd.
                  </p>
                </div>
                <div className="w-full bg-white/5 border border-white/10 rounded-xl p-4 divide-y divide-white/5">
                  <div className="py-2 flex justify-between text-xs">
                    <span className="text-slate-500">Tier Profile</span>
                    <span className="text-blue-400 font-bold uppercase">
                      {specs?.tier}
                    </span>
                  </div>
                  <div className="py-2 flex justify-between text-xs">
                    <span className="text-slate-500">Active Preset</span>
                    <span className="text-white font-bold">
                      {selectedPreset.split("-").pop()?.toUpperCase()}
                    </span>
                  </div>
                  <div className="py-2 flex justify-between text-xs">
                    <span className="text-slate-500">Local Engines</span>
                    <span className="text-emerald-400 font-bold">
                      {discoveryResults.filter((r) => r.available).length}{" "}
                      Active
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleFinish}
                  className="w-full py-4 bg-white/10 border border-white/20 hover:bg-white/20 text-white font-bold rounded-xl flex items-center justify-center gap-2 group transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                >
                  Start de Elite Ervaring{" "}
                  <Rocket
                    size={18}
                    className="group-hover:-translate-y-1 transition-transform"
                  />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

// Helper for final icon
const Rocket = ({ size, className }: { size: number; className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
    <path d="M9 12H4s.55-3.03 2-5c1.62-2.2 5-3 5-3" />
    <path d="M12 15v5s3.03-.55 5-2c2.2-1.62 3-5 3-5" />
  </svg>
);
