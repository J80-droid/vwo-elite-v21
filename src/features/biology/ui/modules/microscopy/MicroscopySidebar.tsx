import { logActivitySQL } from "@shared/api/sqliteService";
import { useTranslations } from "@shared/hooks/useTranslations";
import {
  BookOpen,
  Layers,
  Maximize,
  Microscope,
  Sun,
  Target,
} from "lucide-react";
import React from "react";

import { useModuleState } from "../../../hooks/useBiologyLabContext";
import { defaultMicroscopyState, MicroscopyState } from "../../../types";

export const MicroscopySidebar: React.FC = () => {
  const [state, setState] = useModuleState<MicroscopyState>(
    "microscopy",
    defaultMicroscopyState,
  );
  const { t } = useTranslations();

  const slides = [
    {
      id: "plant",
      labelKey: "biology.microscopy.sidebar.plant_cell",
      icon: Layers,
      color: "text-emerald-400",
    },
    {
      id: "animal",
      labelKey: "biology.microscopy.sidebar.animal_cell",
      icon: Target,
      color: "text-fuchsia-400",
    },
  ];

  const zoomLevels = [40, 100, 400, 1000];

  const handleSelectSlide = (id: string) => {
    setState((prev) => ({ ...prev, selectedSlide: id }));
    logActivitySQL("bio", `Specimen selected: ${id}`, 10);
  };

  return (
    <div className="h-full flex flex-col p-4 space-y-6 overflow-y-auto custom-scrollbar">
      {/* Specimen Library */}
      <div className="bg-white/5 p-4 rounded-xl border border-white/5">
        <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
          <Microscope size={14} className="text-blue-400" />{" "}
          {t("biology.microscopy.sidebar.slides")}
        </h3>
        <div className="grid grid-cols-1 gap-2">
          {slides.map((slide) => (
            <button
              key={slide.id}
              onClick={() => handleSelectSlide(slide.id)}
              className={`
                                flex items-center justify-between px-4 py-3 rounded-xl border transition-all
                                ${
                                  state.selectedSlide === slide.id
                                    ? "bg-blue-500/10 border-blue-500/50 text-white"
                                    : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:border-white/20"
                                }
                            `}
            >
              <div className="flex items-center gap-3">
                <slide.icon
                  size={16}
                  className={
                    state.selectedSlide === slide.id
                      ? "text-blue-400"
                      : slide.color
                  }
                />
                <span className="text-xs font-bold">{t(slide.labelKey)}</span>
              </div>
              {state.selectedSlide === slide.id && (
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Magnification */}
      <div className="bg-white/5 p-4 rounded-xl border border-white/5">
        <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
          <Maximize size={14} className="text-amber-400" />{" "}
          {t("biology.microscopy.sidebar.magnification")}
        </h3>
        <div className="grid grid-cols-4 gap-2">
          {zoomLevels.map((lvl) => (
            <button
              key={lvl}
              onClick={() => setState((p) => ({ ...p, zoom: lvl }))}
              className={`
                                py-2 rounded-lg text-[10px] font-black transition-all
                                ${
                                  state.zoom === lvl
                                    ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                                    : "bg-white/5 border border-white/10 text-slate-500 hover:text-slate-300"
                                }
                            `}
            >
              {lvl}X
            </button>
          ))}
        </div>
      </div>

      {/* Illumination & Focus */}
      <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-6">
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center justify-between mb-3">
            <span className="flex items-center gap-2">
              <Sun size={12} className="text-yellow-400" />{" "}
              {t("biology.microscopy.sidebar.brightness")}
            </span>
            <span className="text-white font-mono">{state.brightness}%</span>
          </label>
          <input
            type="range"
            min="10"
            max="200"
            value={state.brightness}
            onChange={(e) =>
              setState((p) => ({ ...p, brightness: parseInt(e.target.value) }))
            }
            className="w-full accent-blue-500"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center justify-between mb-3">
            <span className="flex items-center gap-2">
              <BookOpen size={12} className="text-purple-400" />{" "}
              {t("biology.microscopy.sidebar.contrast")}
            </span>
            <span className="text-white font-mono">{state.contrast}%</span>
          </label>
          <input
            type="range"
            min="50"
            max="150"
            value={state.contrast}
            onChange={(e) =>
              setState((p) => ({ ...p, contrast: parseInt(e.target.value) }))
            }
            className="w-full accent-blue-500"
          />
        </div>
      </div>
    </div>
  );
};
