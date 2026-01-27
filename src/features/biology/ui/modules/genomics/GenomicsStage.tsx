import { useGenomicsStage } from "@features/biology/hooks/useGenomicsStage";
import { useSettings } from "@shared/hooks/useSettings";
import { useTranslations } from "@shared/hooks/useTranslations";
import { useVoiceCoachContext } from "@shared/lib/contexts/VoiceCoachContext";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, X, Zap } from "lucide-react";
import React from "react";

import { DnaHelix } from "@/components/visualization/DnaHelix";
import { DnaReplication } from "@/components/visualization/DnaReplication";

import { CrisprVisualizer } from "../advanced/CrisprVisualizer";
import { GelElectrophoresisSim } from "../advanced/GelElectrophoresisSim";
import { PcrSimulator } from "../advanced/PcrSimulator";

export const GenomicsStage: React.FC = () => {
  const { settings } = useSettings();
  const { t, lang } = useTranslations();

  const {
    state,
    setViewerRef,
    handleAnalyzeSnapshot,
    closeAnalysis,
    closeTool,
    setSelectedIndex,
  } = useGenomicsStage({ settings, language: lang });

  // AI Coach Context
  useVoiceCoachContext(
    "BiologyLab",
    `Je bent een biologie expert in het Genomics Lab. Huidige sequentie lengte: ${state.sequence?.length || 0}bp. Modus: ${state.viewMode}. PDB: ${state.pdbId}.`,
    {
      activeModule: "genomics",
      pdb: state.pdbId,
      sequencePreview: state.sequence?.substring(0, 50) || "",
    },
  );

  return (
    <div
      className="h-full flex flex-col relative"
      id="genomics-stage-container"
    >
      {/* Main Viewer */}
      <div className="flex-1 relative bg-gradient-to-b from-black to-slate-950 overflow-hidden group">
        <AnimatePresence mode="wait">
          {state.viewMode === "pdb" ? (
            <motion.div
              key="pdb"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.5, ease: "circOut" }}
              ref={setViewerRef}
              className="absolute inset-0 w-full h-full"
            />
          ) : state.replicationMode ? (
            <motion.div
              key="replication"
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ duration: 0.6, type: "spring", damping: 20 }}
              className="absolute inset-0"
            >
              <DnaReplication
                sequence={state.sequence}
                active={state.replicationMode}
              />
            </motion.div>
          ) : (
            <motion.div
              key="procedural"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0"
            >
              <DnaHelix
                sequence={state.sequence}
                onBaseClick={setSelectedIndex}
                selectedIndex={state.selectedIndex}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Analyze Button Overlay */}
        <div className="absolute top-4 right-4 z-20">
          <button
            onClick={handleAnalyzeSnapshot}
            className="bg-purple-600/90 hover:bg-purple-500 text-white px-4 py-2 rounded-full font-bold flex items-center gap-2 shadow-lg backdrop-blur transition-all hover:scale-105"
          >
            <Camera size={18} />
            {state.analyzing
              ? t("biology.genomics.stage.coach_analysing")
              : "Coach"}
          </button>
        </div>
      </div>

      {/* Analysis Modal */}
      {state.analysisResult && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-zinc-900 border border-purple-500/30 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-purple-500/10">
              <h3 className="font-bold text-white flex items-center gap-2">
                <div className="relative w-6 h-6">
                  <div className="absolute inset-0 bg-grid-small-white/[0.2] [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />
                  <Zap className="absolute inset-0 text-purple-400" size={16} />
                </div>
                {t("biology.genomics.stage.coach_title")}
              </h3>
              <button
                onClick={closeAnalysis}
                className="text-zinc-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto prose prose-invert prose-sm">
              <p className="whitespace-pre-wrap text-slate-300">
                {state.analysisResult}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tool Overlays */}
      {state.activeTool !== "none" && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-12">
          <div className="relative w-full max-w-4xl h-full max-h-[600px] animate-in zoom-in-95 fade-in duration-300">
            <button
              onClick={closeTool}
              className="absolute -top-12 right-0 text-slate-400 hover:text-white flex items-center gap-2 group"
            >
              <span className="text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                {t("biology.genomics.stage.close")}
              </span>
              <X size={24} />
            </button>

            {state.activeTool === "gel" && (
              <GelElectrophoresisSim
                samples={[
                  {
                    id: "1",
                    name: t("biology.genomics.stage.gel_control"),
                    fragments: [100, 500, 1000],
                  },
                  {
                    id: "2",
                    name: t("biology.genomics.stage.gel_patient_a"),
                    fragments: [100, 450, 1000],
                  },
                  {
                    id: "3",
                    name: t("biology.genomics.stage.gel_patient_b"),
                    fragments: [100, 500, 1000],
                  },
                ]}
              />
            )}
            {state.activeTool === "pcr" && <PcrSimulator />}
            {state.activeTool === "crispr" && <CrisprVisualizer />}
          </div>
        </div>
      )}
    </div>
  );
};
