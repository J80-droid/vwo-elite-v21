/* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any -- Tone.js and translation types */
/**
 * MathLabModern - Refactored MathLab using Plugin Architecture
 *
 * This is the main MathLab page that uses:
 * - Registry-based module loading
 * - Context-based state management
 * - Dynamic component rendering
 * - HubView for module selection grid
 */

import { MathLabProvider } from "@features/math/hooks/MathLabContext";
import { useMathLabContext } from "@features/math/hooks/useMathLabContext";
import { useMathVoice } from "@features/math/hooks/useMathVoice";
import { type MathModule, SNAPSHOT_PRESETS } from "@features/math/types";
import { HubView } from "@features/math/ui/hub";
import { useMathLabSections } from "@features/math/ui/MathLabContent";
import { MathLabLayout } from "@features/math/ui/MathLabLayout";
import { FormulaBrowser } from "@features/search/ui/FormulaBrowser";
import { useFormulas } from "@shared/hooks/useFormulas";
import { useSaveStudyMaterial } from "@shared/hooks/useLocalData";
import { useTranslations } from "@shared/hooks/useTranslations";
import { useVoiceCoach } from "@shared/lib/contexts/VoiceCoachContext";
import { getXrStoreAsync } from "@shared/model/xr";
import { toPng } from "html-to-image";
import {
  Calendar,
  Camera,
  Check,
  Download,
  FileText,
  Glasses,
  Hash,
  List,
  Mic,
  MicOff,
  Palette,
  RotateCcw,
  Settings2,
  Type,
  User,
  Volume2,
  VolumeX,
  X,
  Zap,
} from "lucide-react";
import * as math from "mathjs";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

let globalTone: any = null; // Module-level cache for Tone.js

interface MathLabModernProps {
  initialModule?: MathModule;
}

const MathLabModernInner: React.FC = () => {
  const { module } = useParams();
  const navigate = useNavigate();
  const ctx = useMathLabContext();
  const { t } = useTranslations();

  // Use Voice Control Hook
  useMathVoice();

  const { allFormulas, toggleFavorite, isFavorite, addCustomFormula } =
    useFormulas();
  const {
    setShowFAB,
    isActive: isVoiceActive,
    setIsActive: setIsVoiceActive,
  } = useVoiceCoach();
  const saveToLibrary = useSaveStudyMaterial();

  // --- GLOBAL UI STATE ---
  const [isSonifying, setIsSonifying] = useState(false);

  // 1. REF FOR OSCILLATOR
  const oscillatorRef = useRef<any>(null); // Type 'any' for Tone object

  const {
    activeModule,
    setActiveModule,
    isConsoleOpen,
    setIsConsoleOpen,
    consoleHeight,
    setConsoleHeight,
    processedFunctions,
    setScannerX,
    vectorSettings,
    browserOpen,
    setBrowserOpen,
    setSelectedFormulaId,
    screenshotStatus,
    setScreenshotStatus,
    isCapturing,
    setIsCapturing,
    snapshotOpts,
    setSnapshotOpts,
    surfacePlotterRef,
    integralState,
    parameters,
  } = ctx;

  const { inputSection, paramsSection, resultsSection, stageSection } =
    useMathLabSections();

  // --- URL SYNC ---
  // 1. Sync URL -> Context (runs when URL param changes)
  useEffect(() => {
    if (module) {
      // URL has a module - set it
      setActiveModule(module as any);
    } else {
      // Hub view - clear activeModule
      setActiveModule(null as any);
    }
  }, [module, setActiveModule]); // Added setActiveModule to deps for 100% Elite safety

  // 2. Sync Selection -> URL (handled by onSelect prop)

  useEffect(() => {
    setShowFAB(false);
    return () => setShowFAB(true);
  }, [setShowFAB]);

  // 2. AUDIO LOOP (Sonification Engine)
  useEffect(() => {
    if (!isSonifying) return;

    let rafId: number;
    let x = -10;
    let active = true;

    const runSonification = async () => {
      if (!globalTone) {
        try {
          globalTone = await import("tone");
        } catch (e) {
          console.warn("Failed to load Tone.js in MathLab", e);
          return;
        }
      }
      const Tone = globalTone;

      if (Tone.context.state !== "running") {
        try {
          await Tone.start();
        } catch (e) {
          console.warn("Audio context failed to start in MathLab", e);
          return;
        }
      }

      // Ensure we are still active before creating objects
      if (!active) return;

      // Start Oscillator if not exists
      if (!oscillatorRef.current) {
        try {
          const osc = new Tone.Oscillator(440, "sine").toDestination();
          osc.start();
          oscillatorRef.current = osc;
        } catch (e) {
          console.error("Failed to create oscillator", e);
          return;
        }
      }

      const loop = () => {
        if (!active) return;
        x += 0.05; // Scan speed
        if (x > 10) x = -10;

        // Update scanner position in context
        if (setScannerX) setScannerX(x);

        if (oscillatorRef.current && processedFunctions[0]) {
          try {
            // Calculate Y value for audio frequency
            const scope = { x, t: 0, ...vectorSettings };
            const y = (math as any).evaluate(processedFunctions[0], scope);

            if (typeof y === "number" && !isNaN(y) && isFinite(y)) {
              // Map Y (-10 to 10) to Frequency (100Hz to 800Hz)
              const clampedY = Math.max(-20, Math.min(20, y));
              const freq = 300 + clampedY * 30;
              oscillatorRef.current.frequency.rampTo(freq, 0.016);
            }
          } catch (e) {
            /* ignore math errors during scan */
          }
        }
        rafId = requestAnimationFrame(loop);
      };
      loop();
    };

    runSonification();

    return () => {
      active = false;
      if (rafId) cancelAnimationFrame(rafId);
      if (oscillatorRef.current) {
        try {
          oscillatorRef.current.stop();
          oscillatorRef.current.dispose();
        } catch (e) {
          /* ignore cleanup errors */
        }
        oscillatorRef.current = null;
      }
      if (setScannerX) setScannerX(null);
    };
  }, [isSonifying, processedFunctions, vectorSettings, setScannerX]);

  // --- ACTIONS ---
  const handleScreenshot = () => {
    setScreenshotStatus("configuring");
  };

  const performCapture = async () => {
    const stage = document.getElementById("mathlab-stage");
    if (!stage) return;

    try {
      setScreenshotStatus("capturing");
      setIsCapturing(true);

      // Give React time to render the overlay
      await new Promise((resolve) => setTimeout(resolve, 100));

      let dataUrl = "";
      if (activeModule === "3d" && surfacePlotterRef.current) {
        dataUrl = await surfacePlotterRef.current.capture();
      } else {
        dataUrl = await toPng(stage, {
          backgroundColor: "#000",
          cacheBust: true,
          pixelRatio: 2,
        });
      }

      const fileName = `MathLab-${activeModule}-${new Date().toISOString()}.png`;
      const link = document.createElement("a");
      link.download = fileName;
      link.href = dataUrl;
      link.click();

      // Save to Library
      await saveToLibrary.mutateAsync({
        id: crypto.randomUUID(),
        name:
          snapshotOpts.customTitle ||
          `MathLab ${activeModule.toUpperCase()} ${new Date().toLocaleTimeString()}`,
        type: "image",
        subject: "Wiskunde",
        content: dataUrl,
        createdAt: Date.now(),
      } as any);

      setScreenshotStatus("saved");
      setTimeout(() => setScreenshotStatus("idle"), 2000);
    } catch (e) {
      console.error("Capture failed:", e);
      setScreenshotStatus("error");
      setTimeout(() => setScreenshotStatus("idle"), 2000);
    } finally {
      setIsCapturing(false);
    }
  };
  const toggleAudio = async () => {
    if (!globalTone) {
      try {
        globalTone = await import("tone");
      } catch (e) {
        console.warn("Failed to load Tone.js", e);
        return;
      }
    }
    const Tone = globalTone;
    if (Tone.context.state !== "running") {
      try {
        await Tone.start();
      } catch (e) {
        console.warn("Audio context start blocked", e);
      }
    }
    setIsSonifying(!isSonifying);
  };

  return (
    <>
      <MathLabLayout
        activeModule={activeModule}
        setActiveModule={(id) => navigate(`/math-modern/${id}`)}
        inputSection={inputSection}
        parameterSection={paramsSection}
        resultSection={resultsSection}
        onSettingsClick={() => {}}
        isConsoleOpen={isConsoleOpen}
        onConsoleToggle={setIsConsoleOpen}
        consoleHeight={consoleHeight}
        onConsoleHeightChange={setConsoleHeight}
      >
        <div className="w-full h-full relative" id="mathlab-stage">
          {activeModule && stageSection}

          {/* --- HUB VIEW --- */}
          {!activeModule && (
            <HubView
              onModuleSelect={(id) => navigate(`/math-modern/${id}`)}
              t={t}
            />
          )}

          {/* --- GLOBAL TOOLBAR (Vertical Right) --- */}
          {/* Minimalistic Neon Style: Transparent base, glow on hover */}
          {/* Hide on hub (no activeModule) and immersive modules */}
          {activeModule &&
            !["gym", "tutor", "concepts"].includes(activeModule) && (
              <div className="absolute top-28 right-6 z-[40] flex flex-col gap-4">
                {/* Audio */}
                <button
                  onClick={toggleAudio}
                  title={
                    isSonifying
                      ? t("calculus.toolbar.mute")
                      : t("calculus.toolbar.unmute")
                  }
                  className={`group relative w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 ${
                    isSonifying
                      ? "text-amber-400"
                      : "text-slate-500 hover:text-white"
                  }`}
                >
                  <div
                    className={`absolute inset-0 rounded-xl border border-transparent transition-all duration-300 ${
                      isSonifying
                        ? "border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.3)] bg-amber-500/10"
                        : "group-hover:border-white/20 group-hover:bg-white/5 group-hover:shadow-[0_0_10px_rgba(255,255,255,0.1)]"
                    }`}
                  />
                  {isSonifying ? (
                    <Volume2
                      size={20}
                      className="drop-shadow-[0_0_5px_rgba(245,158,11,0.8)]"
                    />
                  ) : (
                    <VolumeX size={20} />
                  )}
                </button>

                {/* Voice Control */}
                <button
                  onClick={() => setIsVoiceActive(!isVoiceActive)}
                  title={t("calculus.toolbar.voice")}
                  className={`group relative w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 ${
                    isVoiceActive
                      ? "text-blue-400"
                      : "text-slate-500 hover:text-white"
                  }`}
                >
                  <div
                    className={`absolute inset-0 rounded-xl border border-transparent transition-all duration-300 ${
                      isVoiceActive
                        ? "border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)] bg-blue-500/10"
                        : "group-hover:border-white/20 group-hover:bg-white/5 group-hover:shadow-[0_0_10px_rgba(255,255,255,0.1)]"
                    }`}
                  />
                  {isVoiceActive ? (
                    <MicOff
                      size={20}
                      className="drop-shadow-[0_0_5px_rgba(59,130,246,0.8)]"
                    />
                  ) : (
                    <Mic size={20} />
                  )}
                </button>

                {/* Screenshot */}
                <button
                  onClick={handleScreenshot}
                  disabled={isCapturing || screenshotStatus === "configuring"}
                  title={t("calculus.snapshot.tooltip")}
                  className={`group relative w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:text-white transition-all duration-300 ${isCapturing ? "animate-pulse opacity-50" : ""}`}
                >
                  <div className="absolute inset-0 rounded-xl border border-transparent group-hover:border-white/20 group-hover:bg-white/5 group-hover:shadow-[0_0_10px_rgba(255,255,255,0.1)] transition-all duration-300" />
                  {screenshotStatus === "saved" ? (
                    <Check
                      size={20}
                      className="text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]"
                    />
                  ) : (
                    <Camera size={20} />
                  )}
                </button>

                {/* Reset View (Analytics & Symbolic) */}
                {["analytics", "symbolic"].includes(activeModule) && (
                  <button
                    onClick={() => ctx.graphPlotterRef.current?.resetView()}
                    title={t("calculus.toolbar.reset")}
                    className="group relative w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:text-white transition-all duration-300"
                  >
                    <div className="absolute inset-0 rounded-xl border border-transparent group-hover:border-white/20 group-hover:bg-white/5 group-hover:shadow-[0_0_10px_rgba(255,255,255,0.1)] transition-all duration-300" />
                    <RotateCcw size={20} />
                  </button>
                )}

                {/* Settings (Analytics & Symbolic) */}
                <button
                  onClick={() => {
                    if (["analytics", "symbolic"].includes(activeModule)) {
                      ctx.graphPlotterRef.current?.toggleSettings();
                    }
                  }}
                  title={t("calculus.toolbar.settings")}
                  className="group relative w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:text-white transition-all duration-300"
                >
                  <div className="absolute inset-0 rounded-xl border border-transparent group-hover:border-white/20 group-hover:bg-white/5 group-hover:shadow-[0_0_10px_rgba(255,255,255,0.1)] transition-all duration-300" />
                  <Settings2 size={20} />
                </button>

                {/* VR/AR (Only 3D) */}
                {activeModule === "3d" && (
                  <div className="flex flex-col gap-4 pt-4 border-t border-white/5 mt-1">
                    <button
                      onClick={async () =>
                        surfacePlotterRef.current
                          ? surfacePlotterRef.current.toggleVR()
                          : (await getXrStoreAsync())?.enterVR()
                      }
                      className="group relative w-10 h-10 flex items-center justify-center rounded-xl text-indigo-400 transition-all duration-300"
                      title={t("calculus.toolbar.vr")}
                    >
                      <div className="absolute inset-0 rounded-xl border border-indigo-500/20 bg-indigo-500/5 group-hover:border-indigo-400/50 group-hover:bg-indigo-500/20 group-hover:shadow-[0_0_15px_rgba(129,140,248,0.3)] transition-all duration-300" />
                      <Glasses
                        size={20}
                        className="drop-shadow-[0_0_5px_rgba(129,140,248,0.5)]"
                      />
                    </button>
                    <button
                      onClick={async () => {
                        if (surfacePlotterRef.current) {
                          surfacePlotterRef.current.toggleAR();
                        } else {
                          (await getXrStoreAsync())?.enterAR();
                        }
                      }}
                      className={`group relative w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 ${ctx.isAR ? "text-emerald-400" : "text-indigo-400"}`}
                      title={t("calculus.toolbar.ar")}
                    >
                      <div
                        className={`absolute inset-0 rounded-xl border transition-all duration-300 ${
                          ctx.isAR
                            ? "border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_15px_rgba(52,211,153,0.3)]"
                            : "border-indigo-500/20 bg-indigo-500/5 group-hover:border-indigo-400/50 group-hover:bg-indigo-500/20 group-hover:shadow-[0_0_15px_rgba(129,140,248,0.3)]"
                        }`}
                      />
                      <Zap
                        size={20}
                        className={
                          ctx.isAR
                            ? "drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]"
                            : "drop-shadow-[0_0_5px_rgba(129,140,248,0.5)]"
                        }
                      />
                    </button>
                  </div>
                )}
              </div>
            )}

          {/* --- SNAPSHOT CAPTURE OVERLAY (Visible during capture) --- */}
          {isCapturing && (
            <div className="absolute inset-0 pointer-events-none z-[200] flex flex-col justify-between p-8 bg-black/10">
              {/* Header Info */}
              <div className="flex justify-between items-start">
                {(snapshotOpts.showTitle || snapshotOpts.showTimestamp) && (
                  <div className="bg-black/80 backdrop-blur-xl border border-white/20 p-5 rounded-2xl shadow-2xl max-w-md">
                    {snapshotOpts.showTitle && (
                      <h2 className="text-xl font-bold text-white mb-2">
                        {snapshotOpts.customTitle || "MathLab Elite Analysis"}
                      </h2>
                    )}
                    {snapshotOpts.showTimestamp && (
                      <div className="flex items-center gap-5 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                        <span className="flex items-center gap-1.5">
                          <User size={12} className="text-emerald-400" />{" "}
                          {t("calculus.snapshot.student")}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar size={12} className="text-blue-400" />{" "}
                          {new Date().toLocaleDateString("nl-NL")}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                {snapshotOpts.showWatermark && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] shadow-lg backdrop-blur-md">
                    VWO Elite Engine v2.0
                  </div>
                )}
              </div>

              {/* Footer Data */}
              {(snapshotOpts.showFunctions ||
                snapshotOpts.showAnalysis ||
                snapshotOpts.showParams) && (
                <div className="bg-black/80 backdrop-blur-xl border border-white/20 p-6 rounded-2xl shadow-2xl space-y-4 max-w-xl self-start">
                  {snapshotOpts.showFunctions &&
                    processedFunctions.filter(Boolean).length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-widest border-b border-white/10 pb-1">
                          {t("calculus.snapshot.toggles.functions")}
                        </h4>
                        {processedFunctions
                          .filter(Boolean)
                          .slice(0, 3)
                          .map((fn, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-3 text-sm font-mono text-white"
                            >
                              <div
                                className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.3)]"
                                style={{
                                  backgroundColor: [
                                    "#00FFFA",
                                    "#FF00DA",
                                    "#46FF00",
                                  ][i % 3],
                                }}
                              />
                              <span className="opacity-60 text-xs">
                                f<sub>{i + 1}</sub>(x) =
                              </span>{" "}
                              {fn}
                            </div>
                          ))}
                      </div>
                    )}

                  {snapshotOpts.showParams &&
                    Object.keys(parameters).length > 0 && (
                      <div className="pt-2 border-t border-white/5">
                        <h4 className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-2">
                          {t("calculus.snapshot.toggles.params")}
                        </h4>
                        <div className="flex flex-wrap gap-x-6 gap-y-1">
                          {Object.entries(parameters).map(([k, v]) => (
                            <div
                              key={k}
                              className="text-xs font-mono text-slate-300"
                            >
                              <span className="text-amber-400">{k}</span> ={" "}
                              {typeof v === "number" ? v.toFixed(3) : v}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {snapshotOpts.showAnalysis && (
                    <div className="flex gap-10 pt-3 border-t border-white/10 text-[10px] uppercase font-bold tracking-wider">
                      <div>
                        <h4 className="text-slate-500 mb-1.5">
                          {t("calculus.snapshot.module_context")}
                        </h4>
                        <div className="text-white flex items-center gap-2">
                          <Check size={10} className="text-emerald-400" />{" "}
                          {activeModule} Mode
                        </div>
                      </div>
                      {integralState.show && (
                        <div>
                          <h4 className="text-slate-500 mb-1.5">
                            {t("calculus.snapshot.analysis_label")} (∫)
                          </h4>
                          <div className="text-emerald-400 font-mono">
                            A = {integralState.result || "..."}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </MathLabLayout>

      {/* --- UNIFIED SNAPSHOT CONFIG MODAL --- */}
      {screenshotStatus === "configuring" && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#1a1d21] border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden scale-in-center">
            {/* Header */}
            <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <Camera size={14} className="text-emerald-400" />{" "}
                {t("calculus.snapshot.title")}
              </h3>
              <button
                onClick={() => setScreenshotStatus("idle")}
                className="text-slate-500 hover:text-white transition-colors p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* Presets */}
            <div className="p-4 border-b border-white/5 flex gap-2">
              {Object.keys(SNAPSHOT_PRESETS).map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    const preset = SNAPSHOT_PRESETS[p];
                    if (preset) setSnapshotOpts(preset);
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase flex items-center justify-center gap-2 transition-all border ${
                    snapshotOpts === SNAPSHOT_PRESETS[p]
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      : "bg-white/5 text-slate-400 border-white/5 hover:bg-white/10"
                  }`}
                >
                  {p === "pws" ? (
                    <FileText size={12} />
                  ) : p === "quick" ? (
                    <Zap size={12} />
                  ) : (
                    <Palette size={12} />
                  )}
                  {p}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              {/* Title Input */}
              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-1">
                  {t("calculus.snapshot.report_title")}
                </label>
                <div className="relative group">
                  <Type
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors"
                  />
                  <input
                    type="text"
                    value={snapshotOpts.customTitle}
                    onChange={(e) =>
                      setSnapshotOpts((s) => {
                        if (!s) return s;
                        return { ...s, customTitle: e.target.value };
                      })
                    }
                    placeholder={t("calculus.snapshot.report_placeholder")}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white outline-none focus:border-emerald-500/50 transition-all placeholder:text-slate-600"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-1">
                  {t("calculus.snapshot.visible_data")}
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    {
                      key: "showFunctions",
                      icon: List,
                      label: t("calculus.snapshot.toggles.functions"),
                      color: "text-blue-400",
                    },
                    {
                      key: "showParams",
                      icon: Hash,
                      label: t("calculus.snapshot.toggles.params"),
                      color: "text-amber-400",
                    },
                    {
                      key: "showAnalysis",
                      icon: Zap,
                      label: t("calculus.snapshot.toggles.analysis"),
                      color: "text-violet-400",
                    },
                    {
                      key: "showTimestamp",
                      icon: Calendar,
                      label: t("calculus.snapshot.toggles.meta"),
                      color: "text-indigo-400",
                    },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() =>
                        setSnapshotOpts((s) => {
                          if (!s) return s;
                          return {
                            ...s,
                            [opt.key]: !s[opt.key as keyof typeof s],
                          };
                        })
                      }
                      className="group w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5 active:scale-[0.98]"
                    >
                      <span className="flex items-center gap-3 text-xs text-slate-300">
                        <opt.icon
                          size={14}
                          className={`${opt.color} group-hover:scale-110 transition-transform`}
                        />
                        {opt.label}
                      </span>
                      <div
                        className={`w-4 h-4 rounded-lg border-2 transition-all flex items-center justify-center ${snapshotOpts[opt.key as keyof typeof snapshotOpts] ? "bg-emerald-500 border-emerald-500" : "border-slate-700"}`}
                      >
                        {snapshotOpts[opt.key as keyof typeof snapshotOpts] && (
                          <Check size={10} className="text-black font-bold" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-white/5 border-t border-white/10 flex gap-3">
              <button
                onClick={() => setScreenshotStatus("idle")}
                className="flex-1 py-2.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
              >
                {t("calculus.snapshot.cancel")}
              </button>
              <button
                onClick={performCapture}
                className="flex-[2] py-2.5 bg-emerald-500/10 border border-emerald-500/50 hover:bg-emerald-500/20 text-emerald-400 font-bold rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)]"
              >
                <Download size={14} /> {t("calculus.snapshot.save")}
              </button>
            </div>
          </div>
        </div>
      )}

      <FormulaBrowser
        isOpen={browserOpen}
        onClose={() => setBrowserOpen(false)}
        category="Wiskunde B"
        formulas={allFormulas}
        onSelect={(id) => {
          setSelectedFormulaId(id);
          setBrowserOpen(false);
        }}
        toggleFavorite={toggleFavorite}
        isFavorite={isFavorite}
        addCustomFormula={addCustomFormula}
      />
    </>
  );
};

const MathLabModern: React.FC<MathLabModernProps> = ({ initialModule }) => {
  return (
    <MathLabProvider {...(initialModule ? { initialModule } : {})}>
      <MathLabModernInner />
    </MathLabProvider>
  );
};

export default MathLabModern;
