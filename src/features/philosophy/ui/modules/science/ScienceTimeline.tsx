import { useTranslations } from "@shared/hooks/useTranslations";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Atom,
  Cpu,
  Globe,
  History,
  LucideIcon,
  Microscope,
  Milestone,
  Stars,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Trans } from "react-i18next";

// --- TYPES ---
interface Paradigm {
  id: "medieval" | "modern" | "contemporary";
  icon: LucideIcon;
  color: string;
}

const PARADIGMS: Paradigm[] = [
  {
    id: "medieval",
    icon: Globe,
    color: "amber",
  },
  {
    id: "modern",
    icon: Atom,
    color: "sky",
  },
  {
    id: "contemporary",
    icon: Cpu,
    color: "fuchsia",
  },
];

export const ScienceTimeline: React.FC = () => {
  const { t } = useTranslations();
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="w-full h-full flex flex-col p-8 gap-8 bg-black overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3 text-teal-400 mb-2">
            <History size={20} />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">
              {t("philosophy.science_timeline.subtitle")}
            </span>
          </div>
          <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">
            {t("philosophy.science_timeline.title")}
          </h2>
          <p className="text-slate-500 text-sm mt-1 max-w-lg">
            <Trans
              i18nKey="philosophy.science_timeline.description"
              components={[
                <span className="text-white font-bold italic" />,
                <span className="text-white font-bold italic" />,
              ]}
            />
          </p>
        </div>

        <div className="flex items-center gap-2 p-2 bg-white/5 border border-white/10 rounded-2xl">
          <div className="px-4 py-1 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-white/10">
            {t("philosophy.science_timeline.paradigm_shift")}
          </div>
          <div className="px-4 py-1 text-xs font-bold text-white uppercase italic">
            {t(
              `philosophy.science_timeline.eras.${PARADIGMS[activeIndex]!.id}.era`,
            )}
          </div>
        </div>
      </div>

      {/* Timeline UI */}
      <div className="relative flex-1 flex flex-col justify-center items-center py-12">
        {/* Connecting Line */}
        <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent top-1/2 -translate-y-1/2" />

        <div className="flex justify-between w-full max-w-5xl relative z-10">
          {PARADIGMS.map((p, idx) => {
            const Icon = p.icon;
            const isActive = activeIndex === idx;

            return (
              <div
                key={p.id}
                className="flex flex-col items-center gap-6 group"
              >
                <button
                  onClick={() => setActiveIndex(idx)}
                  className={`
                                        w-24 h-24 rounded-full border-4 flex items-center justify-center transition-all duration-500 relative
                                        ${isActive ? `bg-${p.color}-500/20 border-${p.color}-500 shadow-[0_0_40px_rgba(var(--color-${p.color}-500),0.3)] scale-110` : "bg-black border-white/10 hover:border-white/30 grayscale hover:grayscale-0"}
                                    `}
                >
                  {isActive && (
                    <motion.div
                      layoutId="aura"
                      className={`absolute inset-0 bg-${p.color}-500/20 rounded-full blur-xl`}
                    />
                  )}
                  <Icon
                    size={32}
                    className={
                      isActive ? `text-${p.color}-400` : "text-slate-500"
                    }
                  />

                  {/* Link indicator */}
                  {idx < PARADIGMS.length - 1 && (
                    <div className="absolute -right-24 top-1/2 -translate-y-1/2 text-white/5">
                      <ArrowRight size={24} />
                    </div>
                  )}
                </button>

                <div className="text-center">
                  <div
                    className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isActive ? `text-${p.color}-400` : "text-slate-500"}`}
                  >
                    {t(`philosophy.science_timeline.eras.${p.id}.era`)}
                  </div>
                  <h4
                    className={`text-sm font-black italic tracking-tight ${isActive ? "text-white" : "text-slate-700"}`}
                  >
                    {t(`philosophy.science_timeline.eras.${p.id}.concept`)}
                  </h4>
                </div>
              </div>
            );
          })}
        </div>

        {/* Focus Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="mt-20 w-full max-w-4xl grid grid-cols-2 gap-8"
          >
            <div className="p-8 bg-white/5 border border-white/5 rounded-[2.5rem] relative group overflow-hidden">
              <div
                className={`absolute top-0 right-0 p-8 opacity-5 text-${PARADIGMS[activeIndex]!.color}-500`}
              >
                <Globe size={80} />
              </div>
              <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Milestone size={12} />{" "}
                {t("philosophy.science_timeline.sections.worldview")}
              </h5>
              <p className="text-xl text-slate-200 leading-relaxed font-light italic">
                "
                {t(
                  `philosophy.science_timeline.eras.${PARADIGMS[activeIndex]!.id}.worldview`,
                )}
                "
              </p>
            </div>

            <div className="p-8 bg-white/5 border border-white/5 rounded-[2.5rem] relative group overflow-hidden">
              <div
                className={`absolute top-0 right-0 p-8 opacity-5 text-${PARADIGMS[activeIndex]!.color}-500`}
              >
                <Microscope size={80} />
              </div>
              <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Zap size={12} />{" "}
                {t("philosophy.science_timeline.sections.human_status")}
              </h5>
              <p className="text-xl text-slate-200 leading-relaxed font-light italic">
                "
                {t(
                  `philosophy.science_timeline.eras.${PARADIGMS[activeIndex]!.id}.status`,
                )}
                "
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer / Exam Tip */}
      <div className="bg-gradient-to-r from-obsidian-900 to-transparent p-6 rounded-2xl border-l-4 border-amber-500/50 flex items-center gap-6">
        <div className="p-3 bg-amber-500/20 text-amber-500 rounded-xl">
          <Stars size={20} />
        </div>
        <div className="flex-1">
          <h6 className="text-xs font-black text-white uppercase tracking-widest mb-1 italic">
            {t("philosophy.science_timeline.exam_hint_title")}
          </h6>
          <p className="text-[11px] text-slate-400 max-w-2xl leading-relaxed">
            <Trans
              i18nKey="philosophy.science_timeline.exam_hint_text"
              components={[
                <span className="text-amber-400 font-bold italic" />,
              ]}
            />
          </p>
        </div>
      </div>
    </div>
  );
};
