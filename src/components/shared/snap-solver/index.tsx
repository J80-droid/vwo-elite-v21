/* eslint-disable no-useless-escape */
import { analyzeVideo, solveProblem } from "@shared/api/gemini/index";
import { useContextManager } from "@shared/hooks/useContextManager";
import { useSettings } from "@shared/hooks/useSettings";
import { useTranslations } from "@shared/hooks/useTranslations";
import { MarkdownRenderer } from "@shared/ui/MarkdownRenderer";
import { Brain, Camera, ImageIcon, Sparkles, XCircle } from "lucide-react";
import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { GraphPlotter } from "@/components/visualization/GraphPlotter";

// --- TYPES ---
export interface SnapData {
  file: { data: string; type: "image" | "video"; mime: string } | null;
  solution: string | null;
  detectedFunctions: string[];
  isSolving: boolean;
  solveMode: "solution" | "socratic";
  hiddenIndices: number[];
}

const DEFAULT_SNAP_DATA: SnapData = {
  file: null,
  solution: null,
  detectedFunctions: [],
  isSolving: false,
  solveMode: "solution",
  hiddenIndices: [],
};

// --- SHARED COMPONENT ---
export const SnapSolver: React.FC<{
  initialData?: Partial<SnapData>;
  onDataChange?: (data: SnapData) => void;
  customTitle?: string;
  customColor?: string;
}> = ({ initialData, onDataChange, customTitle, customColor = "violet" }) => {
  const [localData, setLocalData] = useState<SnapData>({
    ...DEFAULT_SNAP_DATA,
    ...initialData,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync with parent if needed, otherwise local state
  const data = localData;
  const update = (partial: Partial<SnapData>) => {
    const newData = { ...data, ...partial };
    setLocalData(newData);
    if (onDataChange) onDataChange(newData);
  };

  const { settings } = useSettings();
  const { lang } = useTranslations();
  // Helper for snapsolve namespace
  // Assuming useTranslations returns { t, lang, ... } or provided a generic hook.
  // The codebase usually defines specific keys in specific files.
  // Let's implement a quick helper if useTranslations doesn't support Namespaces directly or verify usage.
  // Based on previous files, useTranslations returns { t, lang }.
  // We will assume t takes a key and looks it up. Since files are separate, the hook probably loads them.
  // NOTE: The user's useTranslations hook might require manually namespacing 'snapsolve.key'.
  // Let's check how other components do it. Usually t('snapsolve.title').

  // Correction: I don't see namespace loading in the file. I will use 'snapsolve.XXX' keys.
  const { t } = useTranslations();

  const { addContext } = useContextManager();
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const isVideo = file.type.startsWith("video");
      const reader = new FileReader();
      reader.onloadend = () => {
        update({
          file: {
            data: reader.result as string,
            type: isVideo ? "video" : "image",
            mime: file.type,
          },
          solution: null,
          detectedFunctions: [],
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!data.file) return;

    // Redirect if Socratic Mode
    if (data.solveMode === "socratic") {
      addContext(
        "image",
        `Snap Problem (${new Date().toLocaleTimeString()})`,
        t("snapsolve.socratic_prompt") || "User wants help with this problem.",
        data.file.data,
      );
      navigate("/coach");
      return;
    }

    update({ isSolving: true, detectedFunctions: [] });

    try {
      const base64 = data.file.data.split(",")[1] || "";
      let solution = "";

      if (data.file.type === "video") {
        solution =
          (await analyzeVideo(
            base64,
            data.file.mime,
            lang || "nl",
            settings?.aiConfig,
          )) || "";
      } else {
        solution =
          (await solveProblem(
            base64,
            lang || "nl",
            data.solveMode,
            settings?.aiConfig,
          )) || "";
      }

      // Function extraction logic
      const matches = solution.match(
        /(?:y|[a-zA-Z](?:\([a-zA-Z0-9]+\))?)\s*=\s*([^$\n;]+)/gi,
      );
      let funcs: string[] = [];

      if (matches) {
        funcs = matches
          .map((m) => {
            const parts = m.split("=");
            if (parts.length < 2) return null;

            const raw = parts[1] || "";
            if (!raw) return null;

            return (raw as string)
              .split(/\\implies|implies/i)[0]!
              .replace(/[\$,]/g, "")
              .trim();
          })
          .filter(Boolean) as string[];
        funcs = funcs.filter(
          (f) => f.length > 2 && (f.includes("x") || f.includes("t")),
        );
      }

      update({
        solution,
        isSolving: false,
        detectedFunctions: [...new Set(funcs)],
      });
    } catch (e) {
      console.error(e);
      update({ isSolving: false });
    }
  };

  // --- RENDER HELPERS ---
  const renderInput = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            {t("snapsolve.mode_select") || "MODE SELECT"}
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => update({ solveMode: "solution" })}
              className={`p-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border transition-all ${data.solveMode === "solution"
                ? `bg-${customColor}-500/20 border-${customColor}-500 text-${customColor}-300 shadow-[0_0_10px_rgba(139,92,246,0.2)]`
                : "bg-white/5 border-transparent text-slate-500 hover:bg-white/10"
                }`}
            >
              <Sparkles size={14} />{" "}
              {t("snapsolve.mode_solution") || "Solution"}
            </button>
            <button
              onClick={() => update({ solveMode: "socratic" })}
              className={`p-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border transition-all ${data.solveMode === "socratic"
                ? "bg-teal-500/20 border-teal-500 text-teal-300 shadow-[0_0_10px_rgba(20,184,166,0.2)]"
                : "bg-white/5 border-transparent text-slate-500 hover:bg-white/10"
                }`}
            >
              <Brain size={14} /> {t("snapsolve.mode_coach") || "Coach"}
            </button>
          </div>
        </div>
      </div>

      {!data.file ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-white/40 hover:bg-white/5 transition-all"
        >
          <div className="w-12 h-12 mx-auto mb-3 bg-white/10 rounded-full flex items-center justify-center">
            <Camera className="text-slate-400" size={24} />
          </div>
          <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            {t("snapsolve.upload") || "UPLOAD / SNAP"}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            {t("snapsolve.upload_sub") || "Image or Video"}
          </p>
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden border border-white/20 group">
          {data.file.type === "video" ? (
            <video src={data.file.data} className="w-full h-auto opacity-50" />
          ) : (
            <img
              src={data.file.data}
              alt="Preview"
              className="w-full h-auto opacity-50"
            />
          )}
          <button
            onClick={() =>
              update({ file: null, solution: null, detectedFunctions: [] })
            }
            className="absolute top-2 right-2 p-1 bg-red-500/80 rounded-full text-white hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <XCircle size={16} />
          </button>
        </div>
      )}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,video/*"
      />
    </div>
  );

  const renderResults = () => {
    if (!data.solution) return null;
    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {t("snapsolve.ai_analysis") || "AI ANALYSIS"}
          </span>
        </div>
        <div className="text-xs text-slate-300 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5 shadow-inner">
          <MarkdownRenderer content={data.solution} />
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col md:flex-row gap-6 p-6 overflow-hidden">
      {/* LEFT PANEL: INPUT & CONTROLS */}
      <div className="w-full md:w-80 shrink-0 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
        <div>
          <h2
            className={`text-xl font-black text-white mb-1 uppercase tracking-tight`}
          >
            {customTitle || t("snapsolve.title") || "Snap Solve"}
          </h2>
          <p className="text-xs text-slate-500">
            {t("snapsolve.subtitle") || "AI-powered visual analysis"}
          </p>
        </div>

        {renderInput()}
        {renderResults()}
      </div>

      {/* RIGHT PANEL: VISUAL STAGE */}
      <div className="flex-1 rounded-3xl overflow-hidden border border-white/10 bg-black/50 backdrop-blur relative flex items-center justify-center">
        {!data.file ? (
          <div className="flex flex-col items-center gap-4 text-slate-600">
            <ImageIcon size={64} className="opacity-20" />
            <p className="text-sm font-black uppercase tracking-[0.2em] opacity-50">
              {t("snapsolve.waiting") || "WAITING FOR MEDIA"}
            </p>
          </div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center bg-black/80">
            {data.file.type === "video" ? (
              <video
                src={data.file.data}
                controls
                className="max-w-full max-h-full"
              />
            ) : (
              <img
                src={data.file.data}
                alt="Problem"
                className="max-w-full max-h-full object-contain"
              />
            )}

            {/* Graph Overlay */}
            {data.detectedFunctions.length > 0 && (
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black via-black/80 to-transparent p-4 flex items-end justify-center pointer-events-none">
                <div className="w-full h-full max-w-lg pointer-events-auto">
                  <GraphPlotter
                    functions={data.detectedFunctions.filter(
                      (_, i) => !data.hiddenIndices.includes(i),
                    )}
                  />
                </div>
              </div>
            )}

            {/* Analyze Button Overlay */}
            {!data.solution && !data.isSolving && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <button
                  onClick={handleAnalyze}
                  className={`bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white px-8 py-4 rounded-full font-bold shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all hover:scale-110 active:scale-95 flex items-center gap-3`}
                >
                  {data.solveMode === "socratic" ? (
                    <Brain className="text-teal-400" />
                  ) : (
                    <Sparkles className={`text-${customColor}-400`} />
                  )}
                  <span>{t("snapsolve.btn_analyze") || "START ANALYSIS"}</span>
                </button>
              </div>
            )}

            {data.isSolving && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
                <div className="bg-black/80 backdrop-blur-xl px-8 py-4 rounded-full border border-white/10 flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-emerald-500 rounded-full animate-spin" />
                  <span className="text-xs font-bold uppercase tracking-widest text-white">
                    {t("snapsolve.analyzing") || "ANALYZING..."}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
