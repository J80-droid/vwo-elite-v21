import { AnimatePresence, motion } from "framer-motion";
import {
  Binary,
  Compass,
  Eye,
  Layers,
  Radio,
  Settings,
  Tv,
} from "lucide-react";
import { useState } from "react";

// --- TYPES ---
interface Scenario {
  id: string;
  title: string;
  source: string;
  description: string;
  tech: string;
  analysis: {
    heidegger: {
      concept: string;
      text: string;
    };
    verbeek: {
      concept: string;
      text: string;
    };
  };
}

const SCENARIOS: Scenario[] = [
  {
    id: "memory-grain",
    title: "The Entire History of You",
    source: "Black Mirror",
    tech: "The Grain (Memory Implant)",
    description:
      "Een implantaat dat alles wat je ziet en hoort opneemt en direct kan terugspelen (re-do).",
    analysis: {
      heidegger: {
        concept: "Bestand / Gestel",
        text: 'De herinnering wordt een "voorraad" (Bestand) aan data die op elk moment oproepbaar en manipuleerbaar is. Het leven wordt gereduceerd tot "het bestelbare".',
      },
      verbeek: {
        concept: "Hermeneutische Mediatie",
        text: "De techniek bemiddelt hoe we onszelf begrijpen. Onze identiteit wordt geconstrueerd via de digitale weergave; de lens filtert de interpretatie van het verleden.",
      },
    },
  },
  {
    id: "pre-crime",
    title: "Minority Report",
    source: "Philip K. Dick",
    tech: "Pre-Crime Algorithm",
    description:
      "Een systeem dat misdaden voorspelt voordat ze plaatsvinden, waardoor mensen worden gearresteerd voor hun intenties.",
    analysis: {
      heidegger: {
        concept: "Herausfordern (Uitdagen)",
        text: 'De techniek daagt de menselijke natuur uit om zich als berekenbaar object te tonen. De "mens" verdwijnt in de statistiek van de dataset.',
      },
      verbeek: {
        concept: "Praktische Mediatie",
        text: 'De algoritmes sturen ons handelen (prestatie). De techniek werkt als een morele actor die bepaalt wat "veilig" en "gevaarlijk" gedrag is.',
      },
    },
  },
];

export const SFDecoder: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<Scenario>(
    SCENARIOS[0]!,
  );
  const [activeLens, setActiveLens] = useState<"heidegger" | "verbeek">(
    "heidegger",
  );

  return (
    <div className="w-full h-full flex flex-col p-8 gap-8 bg-black overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 font-bold">
            <Tv size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">
              SF Decoder
            </h2>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1 italic">
              Speculatieve Analyse / Verbeelding
            </p>
          </div>
        </div>

        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 shrink-0">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedScenario(s)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                selectedScenario.id === s.id
                  ? "bg-fuchsia-500/20 border-fuchsia-500/50 text-fuchsia-300 shadow-[0_0_20px_-5px_rgba(217,70,239,0.3)]"
                  : "border-transparent text-slate-500 hover:text-white hover:bg-white/5"
              }`}
            >
              {s.title}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-[500px]">
        {/* Visual Context (Left) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="relative group rounded-[2.5rem] overflow-hidden border border-white/10 bg-gradient-to-br from-fuchsia-900/20 to-black p-1">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(217,70,239,0.1),transparent)]" />
            <div className="bg-obsidian-950/80 backdrop-blur-xl rounded-[2.4rem] p-10 h-full flex flex-col justify-between relative z-10">
              <div>
                <div className="flex items-center justify-between mb-8">
                  <span className="text-[10px] font-black text-fuchsia-400 uppercase tracking-widest border border-fuchsia-500/30 px-3 py-1 rounded-full">
                    Source: {selectedScenario.source}
                  </span>
                  <Layers className="text-slate-700" size={20} />
                </div>
                <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-4 leading-none">
                  {selectedScenario.tech}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed font-light italic">
                  "{selectedScenario.description}"
                </p>
              </div>

              <div className="mt-12 flex items-center gap-4">
                <div className="flex -space-x-3">
                  <div className="w-10 h-10 rounded-full border-2 border-fuchsia-500 bg-obsidian-900 flex items-center justify-center text-fuchsia-500 font-black text-xs">
                    H
                  </div>
                  <div className="w-10 h-10 rounded-full border-2 border-indigo-500 bg-obsidian-900 flex items-center justify-center text-indigo-500 font-black text-xs">
                    V
                  </div>
                </div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Selecteer een lens voor ontsluiting
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[2rem]">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Radio size={14} className="animate-pulse text-fuchsia-500" />{" "}
              Signaal Detectie
            </h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                <span>Instrumentele Waarde</span>
                <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-fuchsia-500 w-3/4" />
                </div>
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                <span>Ontologische Impact</span>
                <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 w-full" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Analysis Stage (Right) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="flex bg-white/5 p-1 rounded-3xl border border-white/10 w-fit">
            <button
              onClick={() => setActiveLens("heidegger")}
              className={`px-8 py-4 rounded-[1.2rem] text-xs font-black uppercase tracking-widest transition-all flex items-center gap-3 border ${
                activeLens === "heidegger"
                  ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300 shadow-[0_0_20px_-5px_rgba(99,102,241,0.3)]"
                  : "border-transparent text-slate-500 hover:text-white hover:bg-white/5"
              }`}
            >
              <Settings size={16} /> Martin Heidegger
            </button>
            <button
              onClick={() => setActiveLens("verbeek")}
              className={`px-8 py-4 rounded-[1.2rem] text-xs font-black uppercase tracking-widest transition-all flex items-center gap-3 border ${
                activeLens === "verbeek"
                  ? "bg-fuchsia-500/20 border-fuchsia-500/50 text-fuchsia-300 shadow-[0_0_20px_-5px_rgba(217,70,239,0.3)]"
                  : "border-transparent text-slate-500 hover:text-white hover:bg-white/5"
              }`}
            >
              <Eye size={16} /> Peter-Paul Verbeek
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeLens + selectedScenario.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className={`flex-1 rounded-[2.5rem] border p-12 relative overflow-hidden flex flex-col 
                                ${activeLens === "heidegger" ? "bg-indigo-950/20 border-indigo-500/20 shadow-[0_0_50px_rgba(79,70,229,0.05)]" : "bg-fuchsia-950/20 border-fuchsia-500/20 shadow-[0_0_50px_rgba(217,70,239,0.05)]"}
                            `}
            >
              <div className="absolute top-0 right-0 p-12 opacity-[0.03]">
                <Binary size={200} />
              </div>

              <div className="mb-10">
                <h3
                  className={`text-4xl font-black uppercase italic tracking-tighter mb-2 ${activeLens === "heidegger" ? "text-indigo-400" : "text-fuchsia-400"}`}
                >
                  {selectedScenario.analysis[activeLens].concept}
                </h3>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">
                  Filosofische Kern
                </div>
              </div>

              <div className="relative group">
                <div
                  className={`absolute -left-6 top-0 bottom-0 w-1 rounded-full ${activeLens === "heidegger" ? "bg-indigo-500" : "bg-fuchsia-500"}`}
                />
                <p className="text-xl text-slate-200 leading-relaxed font-light">
                  {selectedScenario.analysis[activeLens].text}
                </p>
              </div>

              <div className="mt-auto pt-8 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">
                      Impact Type
                    </span>
                    <span className="text-xs font-bold text-white uppercase">
                      {activeLens === "heidegger"
                        ? "Ontologisch (Bestandsverlies)"
                        : "Technologische Mediatie"}
                    </span>
                  </div>
                </div>
                <button
                  className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${activeLens === "heidegger" ? "text-indigo-400" : "text-fuchsia-400"}`}
                >
                  Examen Hint <Compass size={14} />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
