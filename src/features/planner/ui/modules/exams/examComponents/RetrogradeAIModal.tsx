/**
 * RetrogradeAIModal - AI-Enhanced Study Material Analysis
 *
 * Allows users to upload/paste study material and generates
 * a personalized study plan using AI analysis.
 */
import { EliteTask } from "@entities/planner/model/task";
import {
  generateRetrogradePlanWithAI,
  RetrogradeResult,
} from "@shared/api/retrogradeEngine";
import { usePlannerEliteStore } from "@shared/model/plannerStore";
import {
  AlertCircle,
  Calendar,
  Check,
  Clock,
  Loader2,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import React, { useState } from "react";

interface RetrogradeAIModalProps {
  task: EliteTask;
  isOpen: boolean;
  onClose: () => void;
}

export const RetrogradeAIModal: React.FC<RetrogradeAIModalProps> = ({
  task,
  isOpen,
  onClose,
}) => {
  const { addTask, settings } = usePlannerEliteStore();
  const [content, setContent] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<RetrogradeResult | null>(null);
  const [dragActive, setDragActive] = useState(false);

  if (!isOpen) return null;

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setContent(text);
    } catch (err) {
      console.error("Failed to read clipboard:", err);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    try {
      const text = await file.text();
      setContent(text);
    } catch (err) {
      console.error("File read error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerate = async () => {
    if (!content.trim()) return;

    setIsProcessing(true);
    try {
      const retrogradeResult = await generateRetrogradePlanWithAI(
        {
          title: task.title,
          subject: task.subject || "",
          date: task.date,
          ...(task.topic ? { topic: task.topic } : {}),
          ...(task.weight ? { weight: task.weight } : {}),
          ...(task.gradeGoal ? { gradeGoal: task.gradeGoal } : {}),
        },
        content,
        undefined, // Use system default cascade
        settings.region,
      );
      setResult(retrogradeResult);
    } catch (err) {
      console.error("Planning failed:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = () => {
    if (!result) return;
    result.sessions.forEach((session: EliteTask) => {
      addTask({
        ...session,
        parentTaskId: task.id,
      });
    });
    onClose();
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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-xl"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-obsidian-900 border border-white/10 rounded-[32px] overflow-hidden shadow-2xl shadow-indigo-500/10 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-indigo-500/10 to-transparent">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/40">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">
                AI Smart Plan
              </h2>
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                {task.subject}: {task.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full text-slate-500 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {!result ? (
            <>
              {/* Material Input */}
              <div className="space-y-4">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">
                  Studiestof (PDF of Tekst)
                </label>

                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`relative h-64 border-2 border-dashed rounded-3xl transition-all flex flex-col items-center justify-center text-center gap-4 ${
                    dragActive
                      ? "border-indigo-500 bg-indigo-500/10"
                      : "border-white/10 bg-black/20"
                  }`}
                >
                  {isProcessing ? (
                    <div className="space-y-4">
                      <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto" />
                      <p className="text-sm font-bold text-white">
                        AI analyseert je studiestof...
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                        <Upload className="w-6 h-6 text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">
                          Sleep een bestand hierheen
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Ondersteunt .pdf, .txt, .docx
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handlePaste}
                          className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black text-white uppercase tracking-widest transition-all"
                        >
                          Plakken
                        </button>
                        <label className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-[10px] font-black text-white uppercase tracking-widest transition-all cursor-pointer">
                          Browse
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(file);
                            }}
                          />
                        </label>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Manual Textbox */}
              <div className="space-y-4">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">
                  Of handmatig invoeren
                </label>
                <textarea
                  className="w-full h-40 bg-black/40 border border-white/10 rounded-3xl p-6 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 transition-all custom-scrollbar resize-none"
                  placeholder="Plak hier de samenvatting, hoofdstuktitels of leerdoelen..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>
            </>
          ) : (
            /* Results View */
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl flex items-start gap-4">
                <Check className="w-5 h-5 text-emerald-500 mt-1" />
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-tight">
                    Plan Gegenereerd!
                  </h4>
                  <p className="text-[10px] text-emerald-400/60 font-medium leading-relaxed mt-1">
                    Ik heb de stof geanalyseerd en een optimale
                    spaced-repetition route voor je uitgezet.
                    {result.reasoning}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">
                  Geplande Sessies
                </h4>
                {result.sessions.map((session: EliteTask, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 font-black text-xs">
                        {idx + 1}
                      </div>
                      <div>
                        <h5 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">
                          {session.topic}
                        </h5>
                        <div className="flex items-center gap-3 mt-1 text-[10px] font-medium text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} /> {session.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} /> {session.duration} min
                          </span>
                        </div>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                        session.energyRequirement === "high"
                          ? "bg-red-500/20 text-red-400"
                          : session.energyRequirement === "medium"
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-emerald-500/20 text-emerald-400"
                      }`}
                    >
                      {session.energyRequirement}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Footer */}
        <div className="p-6 bg-black/40 border-t border-white/5 flex items-center justify-between gap-4">
          {!result ? (
            <>
              <div className="flex items-center gap-4 text-slate-500">
                <AlertCircle size={16} />
                <p className="text-[10px] font-medium">
                  De AI verdeelt de stof over optimale intervallen voor
                  herinnering.
                </p>
              </div>
              <button
                onClick={handleGenerate}
                disabled={isProcessing || !content.trim()}
                className="px-8 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl text-xs font-black text-white uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Plan Genereren
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setResult(null)}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-xs font-black text-slate-400 uppercase tracking-widest transition-all"
              >
                Opnieuw
              </button>
              <button
                onClick={handleConfirm}
                className="px-10 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-2xl text-xs font-black text-white uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20"
              >
                Bevestig Planning
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
