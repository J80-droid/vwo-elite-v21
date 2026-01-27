/* eslint-disable react-hooks/preserve-manual-memoization */
import { useSettingsContext } from "@features/settings";
import {
  getAllStudies,
  saveStudyReflection,
  searchStudies,
  Study,
} from "@shared/api/studyDatabaseService";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  BookOpen,
  Filter,
  GraduationCap,
  MapPin,
  Search,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useLOBContext } from "./LOBContext";
import { ReflectionModal } from "./ReflectionModal";
import { StudyCard } from "./StudyCard";

export const StudyExplorer: React.FC = () => {
  const { t } = useTranslation("career");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const { settings } = useSettingsContext();
  const { userGrades } = useLOBContext();
  const userProfile = settings?.profile?.profile;
  const [viewMode, setViewMode] = useState<"list" | "swipe">("list");
  const [swipeIndex, setSwipeIndex] = useState(0);

  // Reflection Modal State
  const [isReflectionOpen, setIsReflectionOpen] = useState(false);
  const [likedStudy, setLikedStudy] = useState<Study | null>(null);
  const [showGrades, setShowGrades] = useState(false);

  const handleSwipe = (direction: "left" | "right") => {
    if (direction === "right") {
      const study = studies[swipeIndex];
      if (study) {
        setLikedStudy(study);
        setIsReflectionOpen(true);
      }
    } else {
      // Just move to next if disliked
      setSwipeIndex((prev) => prev + 1);
    }
  };

  const handleSaveReflection = async (reflection: string, tags: string[]) => {
    if (likedStudy) {
      await saveStudyReflection(
        likedStudy.id,
        likedStudy.name,
        reflection,
        tags,
      );
    }
    setSwipeIndex((prev) => prev + 1);
    setIsReflectionOpen(false);
  };

  const studies = useMemo(() => {
    let results = searchQuery ? searchStudies(searchQuery) : getAllStudies();

    if (selectedSector) {
      results = results.filter((s) =>
        s.sectors.some((sec) =>
          sec.toLowerCase().includes(selectedSector.toLowerCase()),
        ),
      );
    }

    return results;
  }, [searchQuery, selectedSector]);

  const sectors = [
    {
      id: "techniek",
      label: t("explorer.filters.tech"),
      color: "from-blue-500 to-cyan-500",
    },
    {
      id: "gezondheid",
      label: t("explorer.filters.health"),
      color: "from-emerald-500 to-green-500",
    },
    {
      id: "economie",
      label: t("explorer.filters.economy"),
      color: "from-amber-500 to-orange-500",
    },
    {
      id: "maatschappij",
      label: t("explorer.filters.society"),
      color: "from-purple-500 to-pink-500",
    },
    {
      id: "natuur",
      label: t("explorer.filters.nature"),
      color: "from-lime-500 to-green-500",
    },
  ];

  return (
    <div className="min-h-screen bg-black/90 font-outfit text-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-white/10 pb-8">
          {/* Controls */}
          <div className="flex items-center gap-4 w-full md:w-auto">
            <button
              onClick={() => window.open("/research/career/plan-b", "_self")}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl text-amber-400 font-bold hover:shadow-lg hover:shadow-amber-500/10 transition-all text-sm"
            >
              <AlertCircle size={16} />
              {t("explorer.plan_b")}
            </button>

            <button
              onClick={() => setShowGrades(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-300 font-bold hover:bg-white/10 transition-all text-sm"
            >
              <GraduationCap size={16} />
              {t("explorer.grades")}
            </button>

            {/* View Toggle */}
            <div className="bg-white/5 p-1 rounded-xl flex">
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-white/10 text-emerald-400" : "text-slate-500 hover:text-slate-300"}`}
              >
                <Filter size={20} />
              </button>
              <button
                onClick={() => setViewMode("swipe")}
                className={`p-2 rounded-lg transition-all ${viewMode === "swipe" ? "bg-white/10 text-emerald-400" : "text-slate-500 hover:text-slate-300"}`}
              >
                <GraduationCap size={20} />
              </button>
            </div>

            {/* Search Bar - Only in List Mode */}
            {viewMode === "list" && (
              <div className="relative flex-1 md:w-80">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  size={20}
                />
                <input
                  type="text"
                  placeholder={t("explorer.search_placeholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-emerald-500/50 transition-colors placeholder:text-slate-600"
                />
              </div>
            )}
          </div>
        </div>

        {viewMode === "list" ? (
          <>
            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedSector(null)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${
                  !selectedSector
                    ? "bg-white/20 border-white/50 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                    : "bg-white/5 hover:bg-white/10 border-white/10 text-slate-300"
                }`}
              >
                {t("explorer.filters.all")}
              </button>
              {sectors.map((sector) => (
                <button
                  key={sector.id}
                  onClick={() =>
                    setSelectedSector(
                      selectedSector === sector.id ? null : sector.id,
                    )
                  }
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${
                    selectedSector === sector.id
                      ? `bg-white/10 border-${sector.color.split("-")[1]}-500/50 text-${sector.color.split("-")[1]}-400 shadow-[0_0_15px_rgba(var(--color-${sector.color.split("-")[1]}-500),0.3)]`
                      : "bg-transparent border-white/10 text-slate-400 hover:border-white/30"
                  }`}
                >
                  {sector.label}
                </button>
              ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {studies.map((study) => (
                  <motion.div
                    key={study.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="group relative bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-emerald-500/30 transition-all hover:shadow-2xl hover:shadow-emerald-500/10 cursor-pointer"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="p-6 space-y-4 relative z-10">
                      <div className="flex justify-between items-start">
                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-emerald-400">
                          <GraduationCap size={20} />
                        </div>
                        {study.numerusFixus && (
                          <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-[10px] font-bold uppercase rounded border border-amber-500/20 flex items-center gap-1">
                            <AlertCircle size={10} />
                            {t("explorer.card.numerus_fixus")}
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-2">
                          {study.name}
                        </h3>
                        <p className="text-slate-400 text-sm font-medium mt-1">
                          {study.institution}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {study.profiles.map((p) => (
                          <span
                            key={p}
                            className="px-2 py-1 bg-white/5 text-slate-300 text-xs rounded-md border border-white/5"
                          >
                            {p}
                          </span>
                        ))}
                      </div>

                      <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-4 text-xs text-slate-400">
                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-slate-500" />
                          {study.city}
                        </div>
                        <div className="flex items-center gap-2">
                          <BookOpen size={14} className="text-slate-500" />
                          {study.language.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {studies.length === 0 && (
              <div className="text-center py-20 text-slate-500">
                <Filter size={48} className="mx-auto mb-4 opacity-50" />
                <p>{t("explorer.empty_state")}</p>
              </div>
            )}
          </>
        ) : (
          /* Swipe Mode Container */
          <div className="flex items-center justify-center h-[600px] relative">
            <div className="w-full max-w-sm aspect-[3/4] relative">
              <AnimatePresence>
                {studies.slice(swipeIndex, swipeIndex + 1).map((study) => (
                  <StudyCard
                    key={study.id}
                    study={study}
                    active={true}
                    onSwipe={handleSwipe}
                    userProfile={userProfile}
                    userGrades={userGrades as Record<string, number> | null}
                  />
                ))}
              </AnimatePresence>

              {/* Empty State for Swiper */}
              {swipeIndex >= studies.length && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-white/5 rounded-3xl border border-white/10">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {t("explorer.swipe_finished")}
                  </h3>
                  <p className="text-slate-400 mb-6">
                    {t("explorer.swipe_msg")}
                  </p>
                  <button
                    onClick={() => setSwipeIndex(0)}
                    className="px-6 py-3 bg-white/10 border border-white/20 text-white font-bold rounded-xl hover:bg-white/20 hover:border-white/40 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all"
                  >
                    {t("explorer.restart")}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {likedStudy && (
        <ReflectionModal
          isOpen={isReflectionOpen}
          onClose={() => {
            setIsReflectionOpen(false);
            setSwipeIndex((prev) => prev + 1); // Skip on close without save? Or just close? Let's assume skip/next.
          }}
          onSave={handleSaveReflection}
          study={likedStudy}
        />
      )}

      {/* Simple Grades Modal */}
      <AnimatePresence>
        {showGrades && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowGrades(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <GraduationCap className="text-emerald-400" />
                  {t("explorer.grades_modal.title")}
                </h3>
                <button
                  onClick={() => setShowGrades(false)}
                  className="text-slate-500 hover:text-white"
                >
                  <Filter size={20} className="rotate-45" />
                </button>
              </div>

              <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                {userGrades ? (
                  Object.entries(userGrades).map(([subject, grade]) => (
                    <div
                      key={subject}
                      className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5"
                    >
                      <span className="font-medium text-slate-300">
                        {subject}
                      </span>
                      <span
                        className={`font-bold ${grade >= 7 ? "text-emerald-400" : "text-amber-400"} `}
                      >
                        {grade}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 text-center">
                    {t("explorer.grades_modal.no_grades")}
                  </p>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center text-xs text-slate-500 uppercase tracking-wider font-bold">
                <span>{t("explorer.grades_modal.source")}</span>
                <span className="flex items-center gap-1 text-emerald-500">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />{" "}
                  {t("explorer.grades_modal.live_synced")}
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
