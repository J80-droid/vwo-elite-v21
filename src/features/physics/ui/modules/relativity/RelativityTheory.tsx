import { BookOpen, Info, Lightbulb, Zap } from "lucide-react";
import React from "react";

export const RelativityTheory: React.FC = () => {
  return (
    <div className="w-full bg-[#0f1014] text-slate-300 p-8 lg:p-16 space-y-24 select-text">
      {/* Header section */}
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full text-rose-400 text-xs font-black uppercase tracking-[0.2em]">
          <BookOpen size={14} />
          Theoretisch Kader
        </div>
        <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter">
          De Wereld van <span className="text-rose-500">Einstein</span>
        </h2>
        <p className="text-xl text-slate-400 leading-relaxed">
          Speciale relativiteitstheorie veranderde fundamenteel hoe we kijken
          naar ruimte, tijd en de aard van de werkelijkheid. Het is geen
          abstracte wiskunde, maar de fysica van extreem hoge snelheden.
        </p>
      </div>

      {/* Content Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Minkowski Spacetime */}
        <div className="group p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-rose-500/30 transition-all duration-500">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Zap className="text-rose-400" size={24} />
          </div>
          <h3 className="text-2xl font-bold text-white mb-4 italic">
            Minkowski Ruimtetijd
          </h3>
          <p className="text-slate-400 leading-relaxed mb-6 font-medium">
            Ruimte en tijd zijn niet onafhankelijk. Ze zijn verweven in een
            vier-dimensionaal continuüm genaamd de ruimtetijd. In het
            bovenstaande diagram kun je zien hoe events zich verhouden in dit
            kader.
          </p>
          <div className="p-4 bg-black/40 rounded-2xl border border-white/5 font-mono text-xs text-rose-300/80">
            Δs² = (cΔt)² - (Δx)² - (Δy)² - (Δz)²
          </div>
        </div>

        {/* Lorentz Transformation */}
        <div className="group p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-rose-500/30 transition-all duration-500">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Info className="text-rose-400" size={24} />
          </div>
          <h3 className="text-2xl font-bold text-white mb-4 italic">
            Lorentz Transformatie
          </h3>
          <p className="text-slate-400 leading-relaxed mb-6 font-medium">
            Wanneer een waarnemer met snelheid v beweegt ten opzichte van een
            ander, veranderen de coördinaten (x, t) volgens de
            Lorentz-transformaties. Hierdoor ontstaan effecten zoals
            tijddilatatie en lengtecontractie.
          </p>
          <div className="p-4 bg-black/40 rounded-2xl border border-white/5 font-mono text-xs text-rose-300/80">
            x&apos; = γ(x - vt) | t&apos; = γ(t - vx/c²)
          </div>
        </div>
      </div>

      {/* Deep Dive Section */}
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="p-10 rounded-[2.5rem] bg-gradient-to-br from-rose-500/10 to-transparent border border-rose-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
            <Lightbulb size={200} className="text-rose-500" />
          </div>
          <h3 className="text-3xl font-black text-white mb-6 tracking-tight uppercase">
            De Centrale Postulaten
          </h3>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="shrink-0 w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center text-sm font-black text-white">
                1
              </div>
              <div>
                <h4 className="text-lg font-bold text-white mb-1">
                  Relativiteitsbeginsel
                </h4>
                <p className="text-slate-400 text-sm">
                  De wetten van de fysica zijn hetzelfde in alle
                  inertiaalsystemen.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="shrink-0 w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center text-sm font-black text-white">
                2
              </div>
              <div>
                <h4 className="text-lg font-bold text-white mb-1">
                  Constantie van de Lichtsnellheid
                </h4>
                <p className="text-slate-400 text-sm">
                  De lichtsnelheid c in vacuüm is hetzelfde voor alle
                  waarnemers, ongeacht hun eigen snelheid.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
            <h4 className="text-rose-400 font-black text-xs uppercase tracking-widest mb-3">
              Tijddilatatie
            </h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Voor een waarnemer in rust lijkt een bewegende klok langzamer te
              lopen. Dit effect wordt pas merkbaar bij snelheden die een
              aanzienlijk deel van de lichtsnelheid zijn.
            </p>
          </div>
          <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
            <h4 className="text-rose-400 font-black text-xs uppercase tracking-widest mb-3">
              Lengtecontractie
            </h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Een object dat ten opzichte van een waarnemer beweegt, wordt
              korter gemeten in de bewegingsrichting dan zijn rustlengte.
            </p>
          </div>
        </div>
      </div>

      {/* Footer space */}
      <div className="max-w-4xl mx-auto text-center py-20">
        <p className="text-slate-600 text-[10px] font-mono uppercase tracking-[0.5em]">
          Elite Physics Engine • Quantum Education Hub
        </p>
      </div>
    </div>
  );
};
