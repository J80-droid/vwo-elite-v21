import { Flame, Target, Trophy, X, Zap } from "lucide-react";
import React from "react";

interface SessionConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (count: number) => void;
  title: string;
}

const OPTIONS = [
  {
    count: 5,
    label: "Sprint",
    icon: <Zap size={20} />,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
  },
  {
    count: 10,
    label: "Standard",
    icon: <Target size={20} />,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    count: 20,
    label: "Endurance",
    icon: <Trophy size={20} />,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    count: 50,
    label: "God Mode",
    icon: <Flame size={20} />,
    color: "text-rose-400",
    bg: "bg-rose-500/10",
  },
];

export const SessionConfigModal: React.FC<SessionConfigModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  title,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-obsidian-950 border border-white/10 rounded-[40px] p-10 relative shadow-2xl overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-emerald-500/10 blur-[100px] pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors p-2 bg-white/5 rounded-full"
        >
          <X size={20} />
        </button>

        <div className="mb-10 text-center">
          <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">
            Configureer <span className="text-emerald-500">Sessie</span>
          </h3>
          <p className="text-slate-400 text-sm font-medium">
            Kies het aantal vragen voor{" "}
            <span className="text-white italic">"{title}"</span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {OPTIONS.map((opt) => (
            <button
              key={opt.count}
              onClick={() => onSelect(opt.count)}
              className="group relative p-6 rounded-3xl border border-white/5 bg-white/[0.02] hover:bg-white/5 transition-all duration-300 text-left overflow-hidden flex flex-col gap-4"
            >
              <div
                className={`w-10 h-10 rounded-xl ${opt.bg} flex items-center justify-center ${opt.color} group-hover:scale-110 transition-transform`}
              >
                {opt.icon}
              </div>
              <div>
                <div className="text-2xl font-black text-white">
                  {opt.count}
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-300">
                  {opt.label}
                </div>
              </div>
              {/* Hover Glow */}
              <div
                className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-br from-transparent to-white/20`}
              />
            </button>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">
            Your progress will be saved automatically
          </p>
        </div>
      </div>
    </div>
  );
};
