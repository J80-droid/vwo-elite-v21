import { checkCompatibility, Study } from "@shared/api/studyDatabaseService";
import { motion, PanInfo, useMotionValue, useTransform } from "framer-motion";
import {
  AlertTriangle,
  BookOpen,
  Building2,
  Check,
  MapPin,
  X,
} from "lucide-react";
import React from "react";

interface StudyCardProps {
  study: Study;
  onSwipe: (direction: "left" | "right") => void;
  active: boolean;
  userProfile?: string | undefined;
  userGrades?: Record<string, number> | null;
}

export const StudyCard: React.FC<StudyCardProps> = ({
  study,
  onSwipe,
  active,
  userProfile,
  userGrades,
}) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const [compatible, setCompatible] = React.useState<{
    compatible: boolean;
    reason?: string;
  }>({ compatible: true });

  React.useEffect(() => {
    // @ts-expect-error - checkCompatibility signature update assumed
    setCompatible(checkCompatibility(study, userProfile, userGrades));
  }, [study, userProfile, userGrades]);

  // Background color indicators based on drag
  const likeOpacity = useTransform(x, [50, 150], [0, 1]);
  const nopeOpacity = useTransform(x, [-150, -50], [1, 0]);

  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    if (Math.abs(info.offset.x) > 100) {
      const direction = info.offset.x > 0 ? "right" : "left";
      onSwipe(direction);
    }
  };

  if (!active) return null;

  return (
    <motion.div
      style={{ x, rotate, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      className="absolute inset-0 w-full h-full bg-black rounded-3xl overflow-hidden border border-white/10 shadow-2xl cursor-grab active:cursor-grabbing"
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* Visual Indicators */}
      <motion.div
        style={{ opacity: likeOpacity }}
        className="absolute top-8 left-8 z-20 border-4 border-emerald-500 rounded-lg px-4 py-2 pointer-events-none"
      >
        <span className="text-4xl font-black text-emerald-500 uppercase tracking-widest">
          INTERESSANT
        </span>
      </motion.div>

      <motion.div
        style={{ opacity: nopeOpacity }}
        className="absolute top-8 right-8 z-20 border-4 border-red-500 rounded-lg px-4 py-2 pointer-events-none"
      >
        <span className="text-4xl font-black text-red-500 uppercase tracking-widest">
          NEE
        </span>
      </motion.div>

      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-black pointer-events-none" />

      <div className="relative z-10 p-8 h-full flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-white/10 text-white rounded-full text-xs font-bold uppercase tracking-wider">
              {study.type}
            </span>
            {study.numerusFixus && (
              <span className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-full text-xs font-bold uppercase tracking-wider">
                Numerus Fixus
              </span>
            )}
            {!compatible.compatible && (
              <span className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/20 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                <AlertTriangle size={12} />
                {compatible.reason}
              </span>
            )}
          </div>

          <h2 className="text-4xl font-black text-white mb-2 leading-tight">
            {study.name}
          </h2>

          <div className="flex items-center gap-2 text-xl text-slate-400 mb-6">
            <Building2 size={20} />
            {study.institution}
          </div>

          <p className="text-lg text-slate-300 leading-relaxed max-w-lg mb-8">
            {study.description}
          </p>

          <div className="flex flex-wrap gap-2 mb-8">
            {study.sectors.map((s) => (
              <span
                key={s}
                className="px-4 py-2 bg-white/5 border border-white/5 rounded-xl text-sm text-slate-300"
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
          <div>
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-1 uppercase tracking-wider font-bold">
              <MapPin size={14} /> Locatie
            </div>
            <div className="text-white font-medium">{study.city}</div>
          </div>
          <div>
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-1 uppercase tracking-wider font-bold">
              <BookOpen size={14} /> Taal
            </div>
            <div className="text-white font-medium">
              {study.language === "en" ? "Engels" : "Nederlands"}
            </div>
          </div>
        </div>

        {/* New Data Fields */}
        {study.stats && (
          <div className="grid grid-cols-3 gap-2 mt-4 bg-white/5 p-4 rounded-2xl border border-white/5">
            <div className="text-center">
              <div className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">
                Startsalaris
              </div>
              <div className="text-emerald-400 font-bold">
                €{study.stats.startingSalary}
              </div>
            </div>
            <div className="text-center border-l border-white/10">
              <div className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">
                Baan Kans
              </div>
              <div
                className={`font-bold ${
                  study.stats.roa === "Zeer Goed"
                    ? "text-emerald-400"
                    : study.stats.roa === "Goed"
                      ? "text-blue-400"
                      : "text-amber-400"
                }`}
              >
                {study.stats.roa}
              </div>
            </div>
            <div className="text-center border-l border-white/10">
              <div className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">
                Tevredenheid
              </div>
              <div className="text-purple-400 font-bold">
                ⭐ {study.stats.studentSatisfaction}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls (Visual Only) */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-6 z-20 pointer-events-none">
        <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500">
          <X size={24} />
        </div>
        <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
          <Check size={24} />
        </div>
      </div>
    </motion.div>
  );
};
