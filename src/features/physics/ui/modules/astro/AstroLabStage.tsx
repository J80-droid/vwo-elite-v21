import React, { useEffect, useState } from "react";

import { AstroOverlay } from "./AstroOverlay";
import { AstroSidebar } from "./AstroSidebar";
import { AstroStage } from "./AstroStage";
import { GravityWellStage } from "./GravityWellStage";
import { HRDiagram } from "./HRDiagram";
import { SpectrumAnalyzer } from "./SpectrumAnalyzer";
import { useAstroAudio } from "./useAstroAudio";
import { useAstroEngine } from "./useAstroEngine";

export const AstroLabStage: React.FC = () => {
  const { showAnalysis, viewMode, temperature, luminosity, setParam } =
    useAstroEngine();
  useAstroAudio();

  // Vertraging voor charts om width-glitches te voorkomen bij openklappen
  const [renderCharts, setRenderCharts] = useState(showAnalysis);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (showAnalysis) {
      timeoutId = setTimeout(() => setRenderCharts(true), 300);
    } else {
      timeoutId = setTimeout(() => setRenderCharts(false), 0);
    }
    return () => clearTimeout(timeoutId);
  }, [showAnalysis]);

  return (
    <div className="relative w-full h-full bg-[#020408] overflow-hidden flex">
      {/* LAAG 1: GLOBAL HUD OVERLAY */}
      <AstroOverlay />

      {/* LAAG 2: Orbital Visualization */}
      <div
        className={`relative h-full transition-all duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)] 
        ${showAnalysis ? "w-0 lg:w-3/5 border-r border-white/10 hidden lg:block" : "w-full border-none"}`}
      >
        {viewMode === "3D" ? <GravityWellStage /> : <AstroStage />}
      </div>

      {/* LAAG 3: Analysis Dashboard */}
      <div
        className={`bg-slate-950/90 backdrop-blur-md flex flex-col z-40 transition-all duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)]
        ${
          showAnalysis
            ? "w-full lg:w-2/5 translate-x-0 opacity-100 border-l border-white/10 shadow-2xl"
            : "w-0 translate-x-20 opacity-0 border-none overflow-hidden"
        }`}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 shrink-0 flex justify-between items-center whitespace-nowrap bg-slate-900/50">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-[0.2em] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 shadow-[0_0_8px_rgba(217,70,239,0.8)]" />
            Star Analysis
          </h3>
          <div className="text-[10px] font-mono text-cyan-400">
            ELITE DATA FEED
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 w-full relative overflow-hidden">
          {renderCharts && (
            <div className="absolute top-0 left-0 right-0 bottom-30 flex flex-col gap-4 p-4 pb-0">
              {/* CHART 1: HR Diagram (Flex 2 - Zoals gevraagd: korter) */}
              <div className="w-full flex-[2] min-h-0 border border-white/10 rounded-lg bg-slate-900/30 relative group overflow-hidden">
                <HRDiagram
                  temp={temperature}
                  luminosity={luminosity}
                  onChange={(t, l) => {
                    setParam("temperature", t);
                    setParam("luminosity", l);
                  }}
                />
              </div>

              {/* CHART 2: Spectrum Analyzer (Flex 3 - Langer voor betere afleesbaarheid) */}
              <div className="w-full flex-[3] min-h-0 border border-white/10 rounded-lg bg-slate-900/30 relative overflow-hidden p-2 flex items-center">
                <div className="w-full h-full relative">
                  <SpectrumAnalyzer temperature={temperature} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* LAAG 4: Controls (Sidebar) */}
      <div className="absolute bottom-0 left-0 w-full z-50 pointer-events-none pb-8 flex justify-center">
        <AstroSidebar />
      </div>
    </div>
  );
};
