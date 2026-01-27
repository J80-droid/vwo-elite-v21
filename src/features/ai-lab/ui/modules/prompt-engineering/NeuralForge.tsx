import {
  AlertTriangle,
  Cpu,
  GitBranch,
  Play,
  RotateCcw,
  Save,
  Sliders,
  Terminal,
} from "lucide-react";
import React, { useState } from "react";

// Types voor de Prompt Structuur
interface PromptLayer {
  id: "system" | "user" | "constraints";
  label: string;
  content: string;
  color: string;
  description: string;
}

export const NeuralForge: React.FC = () => {
  // State voor de "Workbench"
  const [temperature, setTemperature] = useState(0.7);
  const [tokens, setTokens] = useState(0);
  const [output, setOutput] = useState<string>("");
  const [isSimulating, setIsSimulating] = useState(false);

  // De "Gelaagde" Prompt aanpak (Didactisch model)
  const [layers, setLayers] = useState<PromptLayer[]>([
    {
      id: "system",
      label: "Persona & Rol",
      content:
        "Je bent een senior Python developer die lesgeeft aan beginners.",
      color: "text-purple-400 border-purple-500/30",
      description: "Wie is de AI? (System Prompt)",
    },
    {
      id: "user",
      label: "Taak & Context",
      content: 'Leg het concept "Recursie" uit.',
      color: "text-electric border-electric/30",
      description: "Wat moet er gebeuren?",
    },
    {
      id: "constraints",
      label: "Beperkingen & Formaat",
      content: "Gebruik maximaal 3 zinnen. Gebruik een metafoor over spiegels.",
      color: "text-amber-400 border-amber-500/30",
      description: "Hoe moet het eruit zien?",
    },
  ]);

  const handleRun = () => {
    setIsSimulating(true);
    // Simulatie van API call
    setTimeout(() => {
      setOutput(
        "Stel je voor dat je in een kamer staat met twee spiegels tegenover elkaar. Je ziet jezelf oneindig vaak herhaald, steeds kleiner wordend, net zoals een functie die zichzelf aanroept tot een voorwaarde stopt. Zonder die stop-voorwaarde zou je oneindig diep in de spiegelwereld verdwijnen.",
      );
      setTokens(48);
      setIsSimulating(false);
    }, 1200);
  };

  const updateLayer = (index: number, val: string) => {
    const newLayers = [...layers];
    newLayers[index]!.content = val;
    setLayers(newLayers);
  };

  return (
    <div className="h-full bg-obsidian-950 text-slate-200 p-6 flex flex-col gap-6 animate-in fade-in overflow-hidden">
      {/* HEADER */}
      <header className="flex justify-between items-center pb-6 border-b border-white/5">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Cpu className="text-electric" /> Neural Forge{" "}
            <span className="text-xs bg-electric/10 text-electric px-2 py-1 rounded border border-electric/20">
              VWO-Elite Module
            </span>
          </h1>
          <p className="text-slate-400">
            Masterclass Prompt Engineering & LLM Architecture
          </p>
        </div>
        <div className="flex gap-3">
          <div className="flex flex-col items-end mr-4">
            <span className="text-xs text-slate-500 font-bold uppercase">
              Token Cost
            </span>
            <span className="text-emerald-400 font-mono">
              ~${(tokens * 0.0002).toFixed(4)}
            </span>
          </div>
          <button className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg border border-white/10 flex items-center gap-2 transition">
            <Save size={18} /> Opslaan Template
          </button>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 overflow-hidden">
        {/* LINKS: PARAMETERS (De 'Engine' Room) */}
        <div className="lg:col-span-3 bg-obsidian-900 border border-white/10 rounded-xl p-5 flex flex-col gap-8 overflow-y-auto custom-scrollbar">
          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Sliders size={16} /> Hyperparameters
            </h3>

            {/* Temperature Slider */}
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <label className="text-sm font-bold text-white">
                  Temperature
                </label>
                <span className="text-xs font-mono text-electric">
                  {temperature}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-electric h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>Deterministisch (Feiten)</span>
                <span>Creatief (Verhalen)</span>
              </div>
            </div>

            {/* Model Selector */}
            <div className="mb-6">
              <label className="text-sm font-bold text-white block mb-2">
                Model
              </label>
              <select className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm text-slate-300 focus:border-electric outline-none">
                <option>GPT-4o (Reasoning)</option>
                <option>Claude 3.5 Sonnet (Coding)</option>
                <option>Mistral Large (Open Source)</option>
              </select>
            </div>
          </div>

          <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-lg">
            <h4 className="text-amber-500 font-bold text-sm mb-1 flex items-center gap-2">
              <AlertTriangle size={14} /> Didactische Tip
            </h4>
            <p className="text-xs text-amber-200/70 leading-relaxed">
              Bij een hoge temperatuur ({">"}0.7) neemt de kans op hallucinaties
              toe. Gebruik dit alleen voor brainstormen, nooit voor wiskunde.
            </p>
          </div>
        </div>

        {/* MIDDEN: DE PROMPT ARCHITECT (Het eigenlijke werk) */}
        <div className="lg:col-span-5 flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2">
          {layers.map((layer, idx) => (
            <div
              key={layer.id}
              className={`bg-obsidian-900 border ${layer.color} rounded-xl p-1 relative group transition-all hover:shadow-[0_0_20px_rgba(0,0,0,0.5)]`}
            >
              <div className="absolute -left-3 top-4 bg-obsidian-950 border border-white/10 p-1 rounded-full z-10 text-slate-400">
                <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
              </div>
              <div className="p-3 border-b border-white/5 flex justify-between items-center bg-black/20 rounded-t-lg">
                <div>
                  <span
                    className={`text-xs font-bold uppercase tracking-wider ${layer.color.split(" ")[0]!}`}
                  >
                    {layer.label}
                  </span>
                  <p className="text-[10px] text-slate-500">
                    {layer.description}
                  </p>
                </div>
                <button
                  onClick={() => {}}
                  className="text-slate-600 hover:text-white"
                >
                  <RotateCcw size={14} />
                </button>
              </div>
              <textarea
                value={layer.content}
                onChange={(e) => updateLayer(idx, e.target.value)}
                className="w-full bg-transparent text-sm text-slate-200 p-4 outline-none resize-none min-h-[100px] font-mono leading-relaxed"
              />
            </div>
          ))}
          <button
            onClick={handleRun}
            disabled={isSimulating}
            className="w-full py-4 bg-electric hover:bg-electric-glow text-obsidian-950 font-bold rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg"
          >
            {isSimulating ? (
              <Cpu className="animate-spin" />
            ) : (
              <Play fill="currentColor" />
            )}
            {isSimulating ? "Genereren..." : "Executeer Prompt Stack"}
          </button>
          <div className="h-12"></div> {/* Spacer */}
        </div>

        {/* RECHTS: OUTPUT & ANALYSE */}
        <div className="lg:col-span-4 flex flex-col gap-4 h-full overflow-hidden">
          <div className="flex-1 bg-obsidian-900 border border-white/10 rounded-xl flex flex-col overflow-hidden">
            <div className="p-3 border-b border-white/10 bg-black/20 flex justify-between items-center">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <Terminal size={16} className="text-emerald-400" /> Output
                Console
              </span>
              <span className="text-xs font-mono text-slate-500">
                {tokens} tokens • {Math.round((tokens / 1.2) * 100) / 100}ms
              </span>
            </div>
            <div className="flex-1 p-6 font-mono text-sm text-slate-300 leading-relaxed overflow-y-auto custom-scrollbar">
              {output || (
                <span className="text-slate-600 italic">
                  // Wachten op input...
                </span>
              )}
            </div>
          </div>

          {/* Versie Beheer (Git-style) */}
          <div className="h-1/3 min-h-[150px] bg-obsidian-900 border border-white/10 rounded-xl p-4 overflow-y-auto custom-scrollbar">
            <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
              <GitBranch size={14} /> Iteratie Geschiedenis
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 opacity-50 hover:opacity-100 transition cursor-pointer">
                <div className="mt-1 w-2 h-2 rounded-full bg-slate-500"></div>
                <div>
                  <div className="text-xs font-bold text-slate-300">
                    Versie 1 (14:02)
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Geen constraints, te langdradig.
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 w-2 h-2 rounded-full bg-electric shadow-[0_0_8px_cyan]"></div>
                <div>
                  <div className="text-xs font-bold text-white">
                    Versie 2 (Huidig)
                  </div>
                  <div className="text-[10px] text-electric">
                    Constraint toegevoegd: 'Metafoor'.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
