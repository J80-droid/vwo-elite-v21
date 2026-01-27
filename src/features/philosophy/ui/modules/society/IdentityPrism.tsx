import { useTranslations } from "@shared/hooks/useTranslations";
import { AnimatePresence, motion } from "framer-motion";
import { Globe2, LucideIcon, Scan, Users, Zap } from "lucide-react";
import { useState } from "react";

// --- TYPES ---
type IdentityLens = "normativity" | "afrofuturism" | "inclusion";

interface SocialConcept {
  id: IdentityLens;
  color: string;
  icon: LucideIcon;
  philosopher: string;
}

// --- DATA: Examen 2025 Thema's (Structure Only) ---
const SOCIAL_LENSES: Record<IdentityLens, SocialConcept> = {
  normativity: {
    id: "normativity",
    philosopher: "Maren Wehrle / Foucault",
    icon: Scan,
    color: "text-indigo-400 border-indigo-500/50 bg-indigo-500/10",
  },
  afrofuturism: {
    id: "afrofuturism",
    philosopher: "Kodwo Eshun / Sun Ra",
    icon: Zap,
    color: "text-fuchsia-400 border-fuchsia-500/50 bg-fuchsia-500/10",
  },
  inclusion: {
    id: "inclusion",
    philosopher: "Hegel (Heer/Knecht) / Real Humans",
    icon: Users,
    color: "text-emerald-400 border-emerald-500/50 bg-emerald-500/10",
  },
};

export const IdentityPrism = () => {
  const { t } = useTranslations();
  const [activeLens, setActiveLens] = useState<IdentityLens>("afrofuturism");

  return (
    <div className="w-full h-full flex flex-col p-8 gap-8 bg-black overflow-y-auto">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
            <Globe2 size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">
              {t("philosophy.identity_prism.title")}
            </h2>
            <p className="text-sm text-slate-500 font-black uppercase tracking-widest mt-1">
              {t("philosophy.identity_prism.subtitle")}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-[500px]">
        {/* LINKS: Het Prisma (Visualisatie) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center relative bg-white/[0.02] rounded-[3rem] border border-white/5 p-12 overflow-hidden">
          {/* De 'Beam' van licht/techniek */}
          <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.05),transparent)]" />

          {/* De Knoppen / Lenzen */}
          <div className="flex flex-col gap-6 z-10 w-full max-w-sm relative">
            {(Object.keys(SOCIAL_LENSES) as IdentityLens[]).map((key) => {
              const item = SOCIAL_LENSES[key];
              const isActive = activeLens === key;
              const Icon = item.icon;

              return (
                <button
                  key={key}
                  onClick={() => setActiveLens(key)}
                  className={`
                     group relative p-6 rounded-2xl border text-left transition-all duration-500 overflow-hidden
                     ${
                       isActive
                         ? `bg-black border-${item.color.split("-")[1]!}-500 shadow-[0_0_40px_rgba(0,0,0,0.5)] scale-105 z-20`
                         : "bg-black/40 border-white/5 hover:bg-white/5 hover:border-white/20 hover:scale-[1.02] z-10"
                     }
                   `}
                >
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1.5 transition-colors duration-300 ${isActive ? item.color.split(" ")[0]!.replace("text", "bg") : "bg-transparent"}`}
                  />

                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[10px] font-black uppercase tracking-widest ${isActive ? item.color.split(" ")[0] : "text-slate-500"}`}
                    >
                      {t(`philosophy.identity_prism.lenses.${key}.title`)}
                    </span>
                    <div
                      className={`${isActive ? item.color.split(" ")[0]! : "text-slate-600"}`}
                    >
                      <Icon size={20} />
                    </div>
                  </div>

                  <div
                    className={`text-base font-bold transition-colors ${isActive ? "text-white" : "text-slate-500"}`}
                  >
                    {item.philosopher}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* RECHTS: De Reflectie (Inhoud) */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="h-full bg-white/[0.02] rounded-[3rem] border border-white/5 p-10 relative overflow-hidden flex flex-col justify-center backdrop-blur-3xl">
            {/* Achtergrond Effect */}
            <motion.div
              animate={{
                background:
                  activeLens === "normativity"
                    ? "radial-gradient(circle at 100% 0%, rgba(99,102,241,0.1), transparent)"
                    : activeLens === "afrofuturism"
                      ? "radial-gradient(circle at 100% 0%, rgba(232,121,249,0.1), transparent)"
                      : "radial-gradient(circle at 100% 0%, rgba(16,185,129,0.1), transparent)",
              }}
              className="absolute inset-0 transition-colors duration-1000"
            />

            <AnimatePresence mode="wait">
              <motion.div
                key={activeLens}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="relative z-10 flex flex-col h-full"
              >
                <div className="flex-1 flex flex-col justify-center">
                  <div
                    className={`inline-flex items-center gap-3 px-4 py-2 rounded-full border mb-8 text-[10px] font-black uppercase tracking-widest w-fit ${SOCIAL_LENSES[activeLens].color}`}
                  >
                    {(() => {
                      const Icon = SOCIAL_LENSES[activeLens].icon;
                      return <Icon size={14} />;
                    })()}
                    {t("philosophy.identity_prism.exam_issue")}
                  </div>

                  <h3 className="text-3xl md:text-4xl font-black text-white mb-8 leading-tight uppercase italic tracking-tighter">
                    "
                    {t(
                      `philosophy.identity_prism.lenses.${activeLens}.question`,
                    )}
                    "
                  </h3>

                  <div className="p-8 rounded-[2rem] bg-black/40 border border-white/5 shadow-2xl backdrop-blur-md">
                    <p className="text-slate-300 leading-relaxed text-lg font-light">
                      {t(
                        `philosophy.identity_prism.lenses.${activeLens}.analysis`,
                      )}
                    </p>
                  </div>
                </div>

                {/* Examen Context Hint */}
                <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between text-xs text-slate-500 font-mono">
                  <span className="uppercase tracking-widest font-bold text-violet-400">
                    {t(
                      `philosophy.identity_prism.lenses.${activeLens}.context`,
                    )}
                  </span>
                  <span className="opacity-50">
                    {t("philosophy.identity_prism.domain_hint")}
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
