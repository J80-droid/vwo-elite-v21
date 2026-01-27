/**
 * Analytics Results Component
 *
 * AI analysis results, function information, and export functionality.
 */

import { useMathLabContext } from "@features/math/hooks/useMathLabContext";
import { useTranslations } from "@shared/hooks/useTranslations";
import {
  Camera,
  Check,
  Copy,
  Download,
  FileText,
  Loader2,
  Sparkles,
} from "lucide-react";
import React, { useState } from "react";
import ReactMarkdown from "react-markdown";

export const AnalyticsResults: React.FC = () => {
  const { t } = useTranslations();
  const {
    processedFunctions,
    analysisReport,
    setAnalysisReport,
    isAiLoading,
    handleAiAnalysis,
    integralState,
  } = useMathLabContext();

  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  const triggerAiAnalysis = async () => {
    handleAiAnalysis();
  };

  // Convert function to LaTeX format
  const toLatex = (fn: string): string => {
    return fn
      .replace(/\*/g, " \\cdot ")
      .replace(/sqrt\(([^)]+)\)/g, "\\sqrt{$1}")
      .replace(/sin\(/g, "\\sin(")
      .replace(/cos\(/g, "\\cos(")
      .replace(/tan\(/g, "\\tan(")
      .replace(/log\(/g, "\\log(")
      .replace(/ln\(/g, "\\ln(")
      .replace(/\^(\d+)/g, "^{$1}")
      .replace(/\^([a-z])/g, "^{$1}")
      .replace(/pi/g, "\\pi")
      .replace(/theta/g, "\\theta");
  };

  // Copy LaTeX to clipboard
  const copyLatex = async () => {
    const latex = processedFunctions
      .map((fn, i) => `y_{${i + 1}} = ${toLatex(fn)}`)
      .join("\n");
    await navigator.clipboard.writeText(latex);
    setCopySuccess("latex");
    setTimeout(() => setCopySuccess(null), 2000);
  };

  // Screenshot the graph canvas
  const downloadScreenshot = async () => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `mathlab-graph-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    setCopySuccess("screenshot");
    setTimeout(() => setCopySuccess(null), 2000);
  };

  // Copy everything: LaTeX + screenshot as data URL
  const copyFullReport = async () => {
    const latex = processedFunctions
      .map((fn, i) => `y_{${i + 1}} = ${toLatex(fn)}`)
      .join("\n");
    const integralInfo =
      integralState.show && integralState.result
        ? `\n\\int_{${integralState.from}}^{${integralState.to}} f(x) \\, dx = ${integralState.result}`
        : "";

    const fullReport = `% MathLab Export - ${new Date().toLocaleDateString("nl-NL")}\n% Functions:\n${latex}${integralInfo}`;

    await navigator.clipboard.writeText(fullReport);
    setCopySuccess("full");
    setTimeout(() => setCopySuccess(null), 2000);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Export Panel (V2.1 Wow Factor) */}
      <div className="p-4 bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-white/10 rounded-xl backdrop-blur-xl">
        <div className="flex items-center gap-2 mb-3">
          <Download size={14} className="text-cyan-400" />
          <span className="text-[10px] text-cyan-400 uppercase tracking-wider font-bold">
            {t("calculus.analytics.export.title")}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={downloadScreenshot}
            disabled={processedFunctions.length === 0}
            className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 border border-emerald-500/30 hover:border-emerald-400/50 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all disabled:opacity-50"
          >
            {copySuccess === "screenshot" ? (
              <Check size={18} className="text-emerald-400" />
            ) : (
              <Camera size={18} className="text-emerald-400" />
            )}
            <span className="text-[9px] text-emerald-400 uppercase font-bold">
              PNG
            </span>
          </button>
          <button
            onClick={copyLatex}
            disabled={processedFunctions.length === 0}
            className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-gradient-to-br from-violet-500/10 to-violet-600/10 border border-violet-500/30 hover:border-violet-400/50 hover:shadow-[0_0_15px_rgba(139,92,246,0.2)] transition-all disabled:opacity-50"
          >
            {copySuccess === "latex" ? (
              <Check size={18} className="text-violet-400" />
            ) : (
              <FileText size={18} className="text-violet-400" />
            )}
            <span className="text-[9px] text-violet-400 uppercase font-bold">
              LaTeX
            </span>
          </button>
          <button
            onClick={copyFullReport}
            disabled={processedFunctions.length === 0}
            className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-gradient-to-br from-amber-500/10 to-amber-600/10 border border-amber-500/30 hover:border-amber-400/50 hover:shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all disabled:opacity-50"
          >
            {copySuccess === "full" ? (
              <Check size={18} className="text-amber-400" />
            ) : (
              <Copy size={18} className="text-amber-400" />
            )}
            <span className="text-[9px] text-amber-400 uppercase font-bold">
              {t("calculus.analytics.export.all")}
            </span>
          </button>
        </div>
      </div>

      {/* AI Analysis Button */}
      <button
        onClick={triggerAiAnalysis}
        disabled={isAiLoading || processedFunctions.length === 0}
        className="w-full py-3 bg-indigo-500/10 border border-indigo-500/50 hover:bg-indigo-500/20 disabled:border-slate-700 disabled:text-slate-500 disabled:bg-transparent text-indigo-400 font-bold text-sm uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.2)] hover:shadow-[0_0_25px_rgba(99,102,241,0.4)]"
      >
        {isAiLoading ? (
          <>
            <Loader2 size={16} className="animate-spin" />{" "}
            {t("calculus.analyzing")}
          </>
        ) : (
          <>
            <Sparkles size={16} /> {t("calculus.ai_analyze")}
          </>
        )}
      </button>

      {/* Function List */}
      <div className="space-y-2">
        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
          {t("calculus.active_equations")}
        </span>
        {processedFunctions.map((fn, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2 p-2 bg-black/40 rounded-lg border border-white/5 group"
          >
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{
                backgroundColor: [
                  "#00D1FF",
                  "#F055BA",
                  "#00FF9D",
                  "#FFD166",
                  "#A06CD5",
                ][idx % 5],
              }}
            />
            <code className="text-xs font-mono text-white flex-1 truncate">
              {fn}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`y = ${toLatex(fn)}`);
                setCopySuccess(`fn-${idx}`);
                setTimeout(() => setCopySuccess(null), 1500);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-white transition-all"
              title="Copy LaTeX"
            >
              {copySuccess === `fn-${idx}` ? (
                <Check size={12} />
              ) : (
                <Copy size={12} />
              )}
            </button>
          </div>
        ))}
      </div>

      {/* AI Analysis Report */}
      {analysisReport && (
        <div className="mt-4 p-4 bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/30 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={14} className="text-purple-400" />
            <span className="text-[10px] text-purple-300 uppercase tracking-wider font-bold">
              {t("calculus.ai_report")}
            </span>
            <button
              onClick={() => setAnalysisReport(null)}
              className="ml-auto text-[10px] text-slate-500 hover:text-white uppercase tracking-wider"
            >
              {t("common.close")}
            </button>
          </div>
          <div className="prose prose-sm prose-invert max-w-none text-sm">
            <ReactMarkdown>{analysisReport}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};
