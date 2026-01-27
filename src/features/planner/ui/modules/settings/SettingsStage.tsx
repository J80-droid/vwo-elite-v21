/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * SettingsStage - Main configuration panel for Planner Elite
 */
import {
  CHRONOTYPE_PEAK_HOURS,
  DutchRegion,
} from "@entities/planner/model/task";
import { parseICS } from "@shared/api/icalParser";
import { useTranslations } from "@shared/hooks/useTranslations";
import { usePlannerEliteStore } from "@shared/model/plannerStore";
import {
  AlertCircle,
  AlertTriangle,
  Check,
  Clock,
  Download,
  FileJson,
  Globe,
  Image as ImageIcon,
  MapPin,
  Moon,
  RefreshCcw,
  Save,
  Scale,
  Shield,
  ShieldCheck,
  Sunrise,
  Upload,
  Zap,
} from "lucide-react";
import React, { useEffect, useState } from "react";

export const SettingsStage: React.FC = () => {
  const { t } = useTranslations();
  const {
    settings,
    updateSettings,
    resetSettings,
    initialize,
    isInitialized,
    isLoading,
    importTasks,
  } = usePlannerEliteStore();

  const [dragActive, setDragActive] = useState(false);
  const [importStatus, setImportStatus] = useState<
    "idle" | "parsing" | "success" | "error"
  >("idle");
  const [parsedCount, setParsedCount] = useState(0);

  useEffect(() => {
    if (!isInitialized) initialize();
  }, [isInitialized, initialize]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400">
        <RefreshCcw className="w-6 h-6 animate-spin mr-2" />
        Instellingen laden...
      </div>
    );
  }

  const handleUpdate = (updates: any) => {
    updateSettings(updates);
  };

  const handleFile = async (file: File) => {
    setImportStatus("parsing");
    try {
      const text = await file.text();
      const tasks = parseICS(text);

      if (tasks.length > 0) {
        await importTasks(tasks);
        setParsedCount(tasks.length);
        setImportStatus("success");
      } else {
        setImportStatus("error");
      }
    } catch (error) {
      console.error("Failed to parse ICS:", error);
      setImportStatus("error");
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0])
      handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6 pt-24 lg:p-12 lg:pt-24">
      <div className="max-w-4xl mx-auto space-y-12 pb-24">
        {/* Section 0: Rooster Sync & Import (Ported from Schedule) */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 border-b border-white/10 pb-2">
            <RefreshCcw className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">
              Rooster Sync & Import
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() =>
                alert(
                  "Magister/Zermelo API Integratie: \n\n1. Ga naar Magister > Instellingen > API Keys.\n2. Kopieer je persoonlijke token.\n3. Plak deze in de VWO Elite Instellingen.\n\n(Deze functie wordt uitgerold in v2.1)",
                )
              }
              className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center space-y-2 hover:border-indigo-500/30 transition-all group"
            >
              <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center mx-auto group-hover:bg-indigo-500/20 transition-all text-slate-500 group-hover:text-indigo-400">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-[11px] uppercase tracking-wide">
                Magister Connect
              </h3>
            </button>

            <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl text-center space-y-2 shadow-xl shadow-indigo-500/5 transition-all">
              <div className="w-10 h-10 bg-indigo-500 text-white rounded-xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/50">
                <Upload className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-[11px] uppercase tracking-wide">
                iCal Import
              </h3>
            </div>

            <button className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center space-y-2 hover:border-emerald-500/30 transition-all group">
              <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center mx-auto group-hover:bg-emerald-500/20 transition-all text-slate-500 group-hover:text-emerald-400">
                <FileJson className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-[11px] uppercase tracking-wide">
                JSON Bulk
              </h3>
            </button>

            <button className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center space-y-2 hover:border-pink-500/30 transition-all group">
              <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center mx-auto group-hover:bg-pink-500/20 transition-all text-slate-500 group-hover:text-pink-400">
                <ImageIcon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-[11px] uppercase tracking-wide">
                Screenshot / PDF
              </h3>
            </button>
          </div>

          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative p-12 border-2 border-dashed rounded-3xl transition-all flex flex-col items-center justify-center text-center gap-4 ${
              dragActive
                ? "border-indigo-500 bg-indigo-500/10"
                : "border-white/10 bg-black/20"
            } ${importStatus === "parsing" ? "opacity-50 pointer-events-none" : ""}`}
          >
            {importStatus === "success" ? (
              <div className="space-y-4 animate-in zoom-in-95">
                <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                  <Check className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-lg font-bold text-white uppercase tracking-widest">
                  Geregeld!
                </h2>
                <p className="text-slate-400 text-xs font-medium">
                  {parsedCount} afspraken toegevoegd aan je planner.
                </p>
                <button
                  onClick={() => setImportStatus("idle")}
                  className="btn-elite-neon text-[9px] px-6 py-2"
                >
                  Nog een bestand
                </button>
              </div>
            ) : (
              <>
                <div className="p-5 bg-white/5 rounded-full ring-1 ring-white/10 shadow-2xl">
                  <Download
                    className={`w-6 h-6 text-indigo-400 ${dragActive ? "animate-bounce" : ""}`}
                  />
                </div>
                <div>
                  <h2 className="text-sm font-black text-white uppercase tracking-[0.2em]">
                    Sleep je bestand hierheen
                  </h2>
                  <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mt-2">
                    .ics, .json, .png, .jpg, .pdf
                  </p>
                  <label className="mt-6 inline-block btn-elite-neon text-[9px] cursor-pointer">
                    Browse Bestanden
                    <input
                      type="file"
                      accept=".ics,.json,.png,.jpg,.jpeg,.pdf"
                      className="hidden"
                      onChange={(e) =>
                        e.target.files &&
                        e.target.files[0] &&
                        handleFile(e.target.files[0])
                      }
                    />
                  </label>
                </div>
              </>
            )}

            {importStatus === "error" && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 text-[10px] font-bold uppercase tracking-widest">
                <AlertCircle className="w-4 h-4" />
                Import mislukt
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
            <ShieldCheck className="w-8 h-8 text-emerald-500 flex-shrink-0" />
            <div>
              <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest leading-none mb-1">
                Privacy First
              </h4>
              <p className="text-[9px] text-emerald-400/60 leading-relaxed font-bold">
                Je roostergegevens worden uitsluitend LOKAAL verwerkt en
                opgeslagen in je persoonlijke SQLite database.
              </p>
            </div>
          </div>
        </section>

        {/* Header text removed */}

        {/* Section 1: Bio-Rhythm */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 border-b border-white/10 pb-2">
            <Clock className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">
              Bio-Ritme & Productiviteit
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Chronotype */}
            <div className="space-y-3 p-4 bg-white/5 border border-white/10 rounded-2xl">
              <label className="text-sm font-medium text-slate-300">
                Chronotype (Slaap-waakritme)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["morning_lark", "neutral", "night_owl"].map((c) => (
                  <button
                    key={c}
                    onClick={() => handleUpdate({ chronotype: c })}
                    className={`px-3 py-4 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-2 ${
                      settings.chronotype === c
                        ? "bg-indigo-500/10 border-indigo-500/50 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.25)] scale-[1.02]"
                        : "bg-white/5 border-white/10 text-slate-500 hover:border-white/20 hover:bg-white/10"
                    }`}
                  >
                    <div
                      className={`transition-colors duration-300 ${settings.chronotype === c ? "text-indigo-400" : "text-slate-600"}`}
                    >
                      {c === "morning_lark" ? (
                        <Sunrise size={24} />
                      ) : c === "night_owl" ? (
                        <Moon size={24} />
                      ) : (
                        <Scale size={24} />
                      )}
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-wide">
                      {t(`planner.settings.${c}`)}
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-500 italic">
                Piekuren: {CHRONOTYPE_PEAK_HOURS[settings.chronotype].start}:00
                - {CHRONOTYPE_PEAK_HOURS[settings.chronotype].end}:00
              </p>
            </div>

            {/* Preferred Duration */}
            <div className="space-y-3 p-4 bg-white/5 border border-white/10 rounded-2xl">
              <label className="text-sm font-medium text-slate-300">
                Voorkeursduur per blok (minuten)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="15"
                  max="120"
                  step="15"
                  value={settings.preferredStudyDuration}
                  onChange={(e) =>
                    handleUpdate({
                      preferredStudyDuration: parseInt(e.target.value),
                    })
                  }
                  className="flex-1 accent-indigo-500"
                />
                <span className="w-16 text-center py-1 bg-black/30 rounded border border-white/10 text-white font-bold">
                  {settings.preferredStudyDuration}m
                </span>
              </div>
              <p className="text-[10px] text-slate-500">
                Hoe lang wil je gemiddeld onafgebroken studeren?
              </p>
            </div>

            {/* Free Time Goal */}
            <div className="space-y-3 p-4 bg-white/5 border border-white/10 rounded-2xl col-span-1 md:col-span-2 lg:col-span-1">
              <label className="text-sm font-medium text-slate-300">
                Gewenste Vrije Tijd (per dag)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="30"
                  max="480"
                  step="30"
                  value={settings.freeTimePerDay || 120}
                  onChange={(e) =>
                    handleUpdate({ freeTimePerDay: parseInt(e.target.value) })
                  }
                  className="flex-1 accent-emerald-500"
                />
                <span className="w-16 text-center py-1 bg-black/30 rounded border border-white/10 text-white font-bold">
                  {(settings.freeTimePerDay || 120) / 60}u
                </span>
              </div>
              <p className="text-[10px] text-slate-500">
                We proberen deze tijd dagelijks vrij te houden voor ontspanning.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Work Day */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 border-b border-white/10 pb-2">
            <Zap className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">
              Werkdag Limieten
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-300">Start van de dag</span>
                <input
                  type="number"
                  min="5"
                  max="12"
                  value={settings.workDayStart}
                  onChange={(e) =>
                    handleUpdate({ workDayStart: parseInt(e.target.value) })
                  }
                  className="w-16 bg-black/30 border border-white/10 rounded px-2 py-1 text-white text-center"
                />
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-300">Einde van de dag</span>
                <input
                  type="number"
                  min="18"
                  max="24"
                  value={settings.workDayEnd}
                  onChange={(e) =>
                    handleUpdate({ workDayEnd: parseInt(e.target.value) })
                  }
                  className="w-16 bg-black/30 border border-white/10 rounded px-2 py-1 text-white text-center"
                />
              </div>
              <p className="text-[10px] text-slate-500 italic">
                Taken worden nooit buiten dit venster ({settings.workDayStart}
                :00 - {settings.workDayEnd}:00) ingepland.
              </p>
            </div>

            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-300">
                  Buffertijd tussen taken (min)
                </span>
                <select
                  value={settings.bufferMinutes}
                  onChange={(e) =>
                    handleUpdate({ bufferMinutes: parseInt(e.target.value) })
                  }
                  className="bg-obsidian-900 border border-white/10 rounded px-2 py-1 text-white text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                >
                  <option value={0}>Geen</option>
                  <option value={5}>5 min</option>
                  <option value={10}>10 min</option>
                  <option value={15}>15 min</option>
                  <option value={30}>30 min</option>
                </select>
              </div>

              <div className="flex items-center gap-2 mt-4 p-3 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                <Shield className="w-4 h-4 text-indigo-400" />
                <span className="text-[10px] text-indigo-300">
                  Buffertijd helpt bij uitloop en voorkomt stress.
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Region & Exams */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 border-b border-white/10 pb-2">
            <MapPin className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">
              Regio & Examens
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Region */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-4">
              <label className="text-sm font-medium text-slate-300">
                Vakantieregio
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["noord", "midden", "zuid"] as DutchRegion[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => handleUpdate({ region: r })}
                    className={`px-3 py-3 rounded-lg border text-xs font-bold transition-all ${
                      settings.region === r
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                        : "bg-black/20 border-white/10 text-slate-500 hover:border-white/20"
                    }`}
                  >
                    {t(`planner.settings.region_${r}`)}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-500">
                Belangrijk voor het automatisch vrijhouden van vakantiedagen.
              </p>
            </div>

            {/* Exam Mode */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-medium text-white">
                    Examenmodus
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Focus uitsluitend op CE voorbereiding.
                  </p>
                </div>
                <button
                  onClick={() => handleUpdate({ examMode: !settings.examMode })}
                  className={`w-12 h-6 rounded-full relative transition-colors ${
                    settings.examMode ? "bg-indigo-500" : "bg-slate-700"
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                      settings.examMode ? "right-1" : "left-1"
                    }`}
                  />
                </button>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-slate-400">Examenjaar:</span>
                <select
                  value={settings.examYear}
                  onChange={(e) =>
                    handleUpdate({ examYear: parseInt(e.target.value) })
                  }
                  className="bg-obsidian-900 border border-white/10 rounded px-2 py-1 text-white text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                >
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="pt-12">
          <div className="p-6 border border-red-500/20 bg-red-500/5 rounded-3xl space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h3 className="text-lg font-bold text-red-400 uppercase tracking-widest text-sm">
                Gevaarlijke Zone
              </h3>
            </div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-300 font-medium">
                  Instellingen Herstellen
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Zet alle planner instellingen terug naar de standaardwaarden.
                </p>
              </div>
              <button
                onClick={resetSettings}
                className="px-6 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold rounded-xl transition-all"
              >
                Reset Alles
              </button>
            </div>
          </div>
        </section>

        {/* Save Indicator */}
        <div className="fixed bottom-12 right-12 z-50 pointer-events-none slide-up">
          <div className="px-6 py-3 bg-emerald-500/10 backdrop-blur-md border border-emerald-500/30 rounded-full flex items-center gap-2 shadow-2xl">
            <Save className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
              Automatisch opgeslagen in SQLite
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
