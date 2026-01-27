import { ArrowRight, Sparkles } from "lucide-react";
import { useState } from "react";
import { InlineMath } from "react-katex";

// Data structure for an "Onion" problem
const PROBLEM_SET = [
  {
    id: "sin-power",
    latex: "\\sin^3(4x^2 + 1)",
    layers: [
      {
        id: 1,
        name: "Schil (Macht)",
        u: "(\\dots)^3",
        diff: "3(\\dots)^2",
        hint: "Machtsregel: haal de 3 naar voren.",
      },
      {
        id: 2,
        name: "Vrucht (Gonio)",
        u: "\\sin(\\dots)",
        diff: "\\cos(\\dots)",
        hint: "Afgeleide van sinus is cosinus.",
      },
      {
        id: 3,
        name: "Kern (Polynoom)",
        u: "4x^2 + 1",
        diff: "8x",
        hint: "Afgeleide van 4x².",
      },
    ],
  },
  {
    id: "root-ln",
    latex: "\\sqrt{\\ln(x) + 5}",
    layers: [
      {
        id: 1,
        name: "Schil (Wortel)",
        u: "\\sqrt{\\dots}",
        diff: "\\frac{1}{2\\sqrt{\\dots}}",
        hint: "Wortel is macht een half.",
      },
      {
        id: 2,
        name: "Vrucht (Som)",
        u: "\\ln(\\dots) + 5",
        diff: "1",
        hint: "Ketting loopt door, maar afgeleide van de som is...",
      },
      {
        id: 3,
        name: "Kern (Log)",
        u: "\\ln(x)",
        diff: "\\frac{1}{x}",
        hint: "Standaardafgeleide logaritme.",
      },
    ],
  },
  {
    id: "exp-cos",
    latex: "e^{\\cos(2x)}",
    layers: [
      {
        id: 1,
        name: "Schil (Exp)",
        u: "e^{\\dots}",
        diff: "e^{\\dots}",
        hint: "e-macht blijft zichzelf.",
      },
      {
        id: 2,
        name: "Vrucht (Gonio)",
        u: "\\cos(\\dots)",
        diff: "-\\sin(\\dots)",
        hint: "Let op de min!",
      },
      {
        id: 3,
        name: "Kern (Lineair)",
        u: "2x",
        diff: "2",
        hint: "De coëfficiënt van x.",
      },
    ],
  },
];

export const ConceptChain = () => {
  // Choose random problem on mount
  const [problem] = useState(
    () => PROBLEM_SET[Math.floor(Math.random() * PROBLEM_SET.length)],
  );
  const [activeLayer, setActiveLayer] = useState(0); // Which layer are we solving?
  const [inputs, setInputs] = useState<string[]>(["", "", ""]);

  // Check if current input matches expected derivative part
  if (!problem) return null;

  const checkInput = (val: string, layerIndex: number) => {
    const cleanVal = val.replace(/\s/g, "").toLowerCase();
    const correct = (problem.layers[layerIndex]?.diff || "")
      .replace(/\s/g, "")
      .toLowerCase();

    // Allow some basic variations if needed, but strict string match for now
    return (
      cleanVal === correct ||
      cleanVal === correct.replace("(\\dots)", "") ||
      cleanVal.includes(correct)
    );
  };

  return (
    <div className="h-full flex flex-col items-center p-8 overflow-y-auto w-full selection:bg-purple-500/30 font-outfit">
      <div className="max-w-4xl w-full pb-32">
        {/* Header Visualization */}
        <div className="text-center mb-20 animate-in fade-in slide-in-from-top-4 duration-1000">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-emerald-500/5 text-emerald-400 text-[11px] font-black uppercase tracking-[0.2em] mb-8 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
            <Sparkles size={14} className="animate-pulse" /> Concept: De
            Kettingregel
          </div>
          <h2 className="text-4xl font-black text-white mb-4 tracking-tighter uppercase">
            De Kettingregel Ui
          </h2>
          <p className="text-slate-400 mb-12 font-medium text-lg italic opacity-80">
            Pel de functie af van buiten naar binnen.
          </p>

          <div className="relative group">
            <div className="absolute -inset-8 bg-emerald-500/10 blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none elite-alive-glow" />
            <div className="relative p-12 bg-white/[0.03] rounded-[40px] inline-block border border-white/10 shadow-2xl backdrop-blur-3xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
              <div className="relative scale-[2.2] text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-transform duration-700 group-hover:scale-[2.35] py-8">
                <InlineMath math={problem.latex} />
              </div>
            </div>
          </div>
        </div>

        {/* The Onion Layers (Scaffolding) */}
        <div className="flex flex-col gap-8">
          {problem.layers.map((layer, idx) => {
            const isActive = idx === activeLayer;
            const isDone = idx < activeLayer;
            const isLocked = idx > activeLayer;

            return (
              <div
                key={layer.id}
                className={`
                                    relative p-10 rounded-[32px] border transition-all duration-700
                                    ${isActive ? "bg-white/[0.04] border-purple-500/40 scale-[1.02] z-10 shadow-[0_0_50px_rgba(168,85,247,0.1)] backdrop-blur-3xl" : ""}
                                    ${isDone ? "bg-emerald-500/[0.02] border-emerald-500/20 opacity-60" : ""}
                                    ${isLocked ? "bg-black/40 border-white/5 opacity-20 grayscale" : ""}
                                `}
              >
                {isActive && (
                  <div className="absolute inset-0 rounded-[32px] elite-alive-glow bg-purple-500/[0.02] pointer-events-none" />
                )}

                <div className="flex items-center gap-10 relative z-10">
                  {/* Left: Context */}
                  <div
                    className={`
                                        w-16 h-16 rounded-2xl flex items-center justify-center font-black text-white transition-all duration-700 border text-lg
                                        ${isActive ? "bg-purple-500 border-purple-400 shadow-[0_0_30px_rgba(168,85,247,0.5)] scale-110" : "bg-white/5 border-white/10 text-slate-500"}
                                        ${isDone ? "bg-emerald-500 border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]" : ""}
                                    `}
                  >
                    {idx + 1}
                  </div>

                  <div className="w-64">
                    <div
                      className={`text-[10px] uppercase font-black tracking-[0.3em] mb-2 ${isActive ? "text-purple-400" : isDone ? "text-emerald-400" : "text-slate-600"}`}
                    >
                      {layer.name}
                    </div>
                    <div className="text-3xl text-white font-serif tracking-tight drop-shadow-sm">
                      <InlineMath math={layer.u} />
                    </div>
                  </div>

                  <div className="flex items-center justify-center">
                    <ArrowRight
                      className={`
                                            w-8 h-8 transition-all duration-700 ${isActive ? "text-purple-400 animate-pulse translate-x-1" : isDone ? "text-emerald-400" : "text-slate-800"}
                                        `}
                    />
                  </div>

                  {/* Right: Input */}
                  <div className="flex-1">
                    <div className="text-[10px] uppercase font-black text-slate-500 tracking-[0.4em] mb-3">
                      Afgeleide{" "}
                      <span className="opacity-50">
                        <InlineMath math={"f'(u)"} />
                      </span>
                    </div>
                    {isDone ? (
                      <div className="text-3xl text-emerald-400 font-black animate-in fade-in slide-in-from-left-4 duration-700 drop-shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                        <InlineMath math={inputs[idx] || ""} />
                      </div>
                    ) : (
                      <div className="relative group">
                        <input
                          disabled={!isActive}
                          type="text"
                          spellCheck={false}
                          autoComplete="off"
                          placeholder={
                            isActive ? "Type de afgeleide..." : "..."
                          }
                          className={`
                                                        w-full bg-obsidian-900/50 border-2 rounded-2xl px-6 py-5 text-xl text-white font-mono outline-none transition-all duration-500
                                                        ${isActive ? "border-purple-500/50 focus:border-purple-400 focus:bg-purple-500/10 shadow-[inset_0_0_30px_rgba(168,85,247,0.05)]" : "border-white/5"}
                                                    `}
                          onChange={(e) => {
                            const val = e.target.value;
                            const newInputs = [...inputs];
                            newInputs[idx] = val;
                            setInputs(newInputs);
                            if (checkInput(val, idx)) {
                              setTimeout(
                                () => setActiveLayer((l) => l + 1),
                                600,
                              );
                            }
                          }}
                        />
                        {isActive && (
                          <div className="absolute top-full left-2 mt-4 text-[10px] text-purple-400 font-black uppercase tracking-[0.2em] animate-in fade-in slide-in-from-top-2 duration-500">
                            Tip: {layer.hint}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Final Result Assembly */}
        {activeLayer === 3 && (
          <div className="mt-20 p-12 bg-white/[0.03] border border-emerald-500/40 rounded-[40px] text-center animate-in fade-in zoom-in slide-in-from-bottom-8 duration-1000 shadow-[0_0_80px_rgba(16,185,129,0.15)] backdrop-blur-3xl relative overflow-hidden group">
            <div className="absolute -inset-20 bg-emerald-500/5 blur-[80px] opacity-40 pointer-events-none elite-alive-glow" />
            <h3 className="text-emerald-400 font-black uppercase tracking-[0.5em] mb-8 text-[10px] relative z-10 opacity-80 decoration-emerald-500/30 underline underline-offset-8">
              Kettingregel Resultaat
            </h3>
            <div className="text-5xl text-white font-black relative z-10 tracking-tighter">
              <span className="text-white drop-shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <InlineMath
                  math={`${inputs[0]} \\cdot ${inputs[1]} \\cdot ${inputs[2]}`}
                />
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
