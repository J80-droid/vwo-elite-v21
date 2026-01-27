import { DossierModal } from "@features/career/lob/DossierModal";
import { useLOBContext } from "@features/career/lob/LOBContext";
import { VALUES_LIST } from "@shared/assets/data/valuesData";
import { motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Bot,
  BrainCircuit,
  Calendar,
  Compass,
  FileText,
  Globe2,
  Network,
  Plane,
  Search,
  Target,
  Users,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

export const CareerChoiceHub: React.FC = () => {
  const { t } = useTranslation("career");
  const navigate = useNavigate();
  const { bigFiveScores, riasecScores, valuesScores } = useLOBContext();
  const [showDossier, setShowDossier] = useState(false);

  // Calculate Top Big Five
  const topBigFive = useMemo(() => {
    if (!bigFiveScores) return null;
    return Object.entries(bigFiveScores).reduce((a, b) =>
      a[1] > b[1] ? a : b,
    )[0];
  }, [bigFiveScores]);

  // Calculate Top RIASEC
  const topRiasec = useMemo(() => {
    if (!riasecScores) return null;
    return Object.entries(riasecScores).reduce((a, b) =>
      a[1] > b[1] ? a : b,
    )[0];
  }, [riasecScores]);

  // Get Top Values Labels
  const topValues = useMemo(() => {
    if (!valuesScores?.top3) return [];
    return valuesScores.top3
      .map((id) => VALUES_LIST.find((v) => v.id === id)?.label)
      .filter(Boolean);
  }, [valuesScores]);

  const tiles = [
    // --- DOSSIER (Dynamic) ---
    {
      id: "dossier",
      title: "Mijn Carrière Dossier",
      subtitle: "Jouw Profiel Samenvatting",
      icon: FileText,
      color: "text-white",
      bg: "bg-white/5",
      border: "border-white/20",
      path: "/research/career", // Self-link
      colSpan: "col-span-1 md:col-span-3",
      isDossier: true, // Special flag for rendering logic
    },

    // Introspectie
    {
      id: "values",
      title: "Waarden Kompas",
      subtitle: "Jouw Morele Anker",
      icon: Compass,
      color: "text-fuchsia-400",
      bg: "bg-fuchsia-500/10",
      border: "border-fuchsia-500/20",
      path: "/research/career/values",
      colSpan: "col-span-1",
    },
    {
      id: "bigfive",
      title: t("hub.tiles.bigfive.title"),
      subtitle: t("hub.tiles.bigfive.subtitle"),
      icon: Users,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
      path: "/research/career/bigfive",
      colSpan: "col-span-1",
    },
    {
      id: "riasec",
      title: t("hub.tiles.riasec.title"),
      subtitle: t("hub.tiles.riasec.subtitle"),
      icon: BrainCircuit,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      path: "/research/career/riasec",
      colSpan: "col-span-1",
    },
    {
      id: "coach",
      title: t("hub.tiles.coach.title"),
      subtitle: t("hub.tiles.coach.subtitle"),
      icon: Bot,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      path: "/research/career/coach",
      colSpan: "col-span-2 md:col-span-1",
      glow: true,
    },

    // Exploratie
    {
      id: "explorer",
      title: t("hub.tiles.explorer.title"),
      subtitle: t("hub.tiles.explorer.subtitle"),
      icon: Search,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/20",
      path: "/research/career/explorer",
      colSpan: "col-span-1",
      hero: true,
    },
    {
      id: "universe",
      title: t("hub.tiles.universe.title"),
      subtitle: t("hub.tiles.universe.subtitle"),
      icon: Network,
      color: "text-pink-400",
      bg: "bg-pink-500/10",
      border: "border-pink-500/20",
      path: "/research/career/universe",
      colSpan: "col-span-1",
    },

    // Planning
    {
      id: "selection",
      title: t("hub.tiles.selection.title"),
      subtitle: t("hub.tiles.selection.subtitle"),
      icon: Target,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/20",
      path: "/research/career/selection-trainer",
      colSpan: "col-span-1",
    },
    {
      id: "plan_b",
      title: t("hub.tiles.plan_b.title"),
      subtitle: t("hub.tiles.plan_b.subtitle"),
      icon: AlertCircle,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      path: "/research/career/plan-b",
      colSpan: "col-span-1",
    },
    {
      id: "open_days",
      title: t("hub.tiles.open_days.title"),
      subtitle: t("hub.tiles.open_days.subtitle"),
      icon: Calendar,
      color: "text-rose-400",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
      path: "/research/career/open-days",
      colSpan: "col-span-1",
    },
    {
      id: "gap_year",
      title: t("hub.tiles.gap_year.title"),
      subtitle: t("hub.tiles.gap_year.subtitle"),
      icon: Plane,
      color: "text-lime-400",
      bg: "bg-lime-500/10",
      border: "border-lime-500/20",
      path: "/research/career/gap-year",
      colSpan: "col-span-2 md:col-span-1",
    },
  ];

  return (
    <div className="flex-1 h-full overflow-y-auto custom-scrollbar bg-black font-outfit relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/40 via-black to-black z-0 pointer-events-none" />

      <div className="relative z-10 p-8 md:p-12 max-w-7xl mx-auto space-y-12">
        {/* HERO Header */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/5 pb-8">
          <div className="space-y-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-widest"
            >
              <Compass size={14} />
              <span>{t("hub.compass")}</span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-black text-white tracking-tight"
            >
              {t("hub.hero_title")}
            </motion.h1>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-right hidden md:block"
          >
            <p className="text-slate-400 text-sm max-w-xs leading-relaxed">
              {t("hub.hero_subtitle")}
            </p>
          </motion.div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiles.map((tile, index) => {
            // Special Render for Dossier
            if ("isDossier" in tile && tile.isDossier) {
              return (
                <motion.div
                  key={tile.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0 }}
                  onClick={() => setShowDossier(true)}
                  className={`${tile.colSpan} relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 flex flex-col md:flex-row gap-8 items-center cursor-pointer group hover:border-white/40 transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]`}
                >
                  {/* Decoration */}
                  <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 blur-[100px] rounded-full pointer-events-none" />

                  <div className="flex-1 space-y-4 relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-white/10 rounded-lg">
                        <Activity size={20} className="text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-white">
                        Jouw Dossier
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Big Five Metric */}
                      <div className="p-4 rounded-xl bg-black/20 border border-white/5">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Dominante Eigenschap
                        </div>
                        <div className="text-lg font-bold text-purple-400 capitalize">
                          {topBigFive || "Nog niet getest"}
                        </div>
                      </div>

                      {/* RIASEC Metric */}
                      <div className="p-4 rounded-xl bg-black/20 border border-white/5">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                          RIASEC Code
                        </div>
                        <div className="text-lg font-bold text-blue-400 uppercase">
                          {topRiasec || "Nog niet getest"}
                        </div>
                      </div>

                      {/* Values Metric */}
                      <div className="p-4 rounded-xl bg-black/20 border border-white/5">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Top Waarde
                        </div>
                        <div className="text-lg font-bold text-fuchsia-400">
                          {topValues[0] || "Nog niet getest"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDossier(true);
                      }}
                      className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold transition-all group-hover:bg-white group-hover:text-black uppercase tracking-wider text-sm"
                    >
                      Bekijk Details
                    </button>
                  </div>
                </motion.div>
              );
            }

            // Standard Tile Render
            return (
              <motion.div
                key={tile.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                onClick={() => navigate(tile.path)}
                className={`${tile.colSpan} group relative overflow-hidden rounded-3xl border ${tile.border} ${tile.bg} p-1 cursor-pointer transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl hover:shadow-${tile.color.split("-")[1]}-500/10`}
              >
                {/* Inner Content */}
                <div className="relative h-full bg-black/40 backdrop-blur-sm rounded-[1.3rem] p-6 flex flex-col justify-between overflow-hidden">
                  {/* Background Glow */}
                  <div
                    className={`absolute -right-12 -top-12 w-48 h-48 bg-${tile.color.split("-")[1]}-500/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700`}
                  />

                  <div className="relative z-10 flex justify-between items-start">
                    <div
                      className={`p-3 rounded-2xl bg-white/5 ${tile.color} ring-1 ring-white/10 group-hover:ring-${tile.color.split("-")[1]}-500/50 transition-all`}
                    >
                      <tile.icon size={24} />
                    </div>
                    <ArrowRight
                      className={`text-slate-600 group-hover:${tile.color} transition-colors -rotate-45 group-hover:rotate-0 transform duration-300`}
                    />
                  </div>

                  <div className="relative z-10 mt-8 space-y-1">
                    <h3 className="text-xl font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-300 transition-all">
                      {tile.title}
                    </h3>
                    <p
                      className={`${tile.color} text-xs font-bold uppercase tracking-wider opacity-80 group-hover:opacity-100 transition-opacity`}
                    >
                      {tile.subtitle}
                    </p>
                  </div>

                  {/* Hero Specific Visuals */}
                  {"hero" in tile && tile.hero && (
                    <div className="absolute right-0 bottom-0 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                      <Globe2 size={180} className="-mr-12 -mb-12" />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <DossierModal
        isOpen={showDossier}
        onClose={() => setShowDossier(false)}
        bigFiveTopTrait={topBigFive || ""}
        riasecScores={riasecScores}
        valuesScores={valuesScores}
      />
    </div>
  );
};
