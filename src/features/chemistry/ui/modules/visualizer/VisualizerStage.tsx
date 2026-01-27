import { cascadeGenerate } from "@shared/api/aiCascadeService";
import { MoleculeData } from "@shared/api/chemService";
import { useVoiceCoachContext } from "@shared/lib/contexts/VoiceCoachContext";
import { Activity, FileImage, GitCompare, Plus, Ruler, X } from "lucide-react";
import React, { useEffect, useState } from "react";

import { useModuleState } from "../../../hooks/ChemistryLabContext";
import { ChemicalFormula } from "../../ui/ChemicalFormula";
import { Smiles2D } from "../../ui/Smiles2D";
import { VisualizerState } from "./VisualizerSidebar";

// Note: Window.$3Dmol and Window.$ are declared in @shared/types/libraries.d.ts

const MoleculeViewer: React.FC<{
  molecule: MoleculeData | null;
  id: string;
  onClose?: () => void;
  measureMode?: boolean;
}> = ({ molecule, id, onClose, measureMode }) => {
  const [show2D, setShow2D] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!molecule || !(window as any).$3Dmol) return;
    const element = document.getElementById(id);
    if (!element) return;
    element.innerHTML = "";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const viewer = (window as any).$3Dmol.createViewer(element, {
      backgroundColor: "black",
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (molecule.cid && (window as any).$) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).$.ajax({
        url: `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${molecule.cid}/record/SDF/?record_type=3d&response_type=save&response_basename=conservative`,
        success: (data: string | object) => {
          viewer.addModel(data, "sdf");
          viewer.setStyle(
            {},
            { stick: { radius: 0.15 }, sphere: { scale: 0.3 } },
          );
          viewer.zoomTo();
          viewer.render();
          if (measureMode) {
            viewer.setClickable(
              {},
              true,
              (atom: {
                elem: string;
                serial: string;
                x: number;
                y: number;
                z: number;
              }) => {
                viewer.addLabel(atom.elem + atom.serial, {
                  position: atom,
                  backgroundColor: "black",
                  fontColor: "white",
                });
                viewer.render();
              },
            );
          }
        },
      });
    }
  }, [molecule, id, measureMode]);

  if (!molecule)
    return (
      <div
        id={id}
        className="w-full h-full flex items-center justify-center bg-black/20 border border-white/5 rounded-2xl"
      >
        <div className="text-slate-500 flex flex-col items-center">
          <Activity className="opacity-20 mb-2" size={40} />
          <span>Geen molecuul geselecteerd</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-2 right-2 p-2 bg-red-500/20 text-red-500 rounded hover:bg-red-500 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>
    );

  return (
    <div className="relative w-full h-full bg-black rounded-2xl overflow-hidden border border-white/10 group">
      <div id={id} className="w-full h-full" />
      <div className="absolute top-4 left-4 pointer-events-none z-10">
        <h3 className="text-xl font-bold text-white drop-shadow-md">
          {molecule.name}
        </h3>
        <div className="text-sm text-slate-400 drop-shadow-md font-mono mt-1">
          <ChemicalFormula formula={molecule.molecularFormula} />
        </div>
      </div>
      {show2D && (
        <div
          className="absolute inset-0 bg-black/80 flex items-center justify-center z-20 backdrop-blur-sm p-8"
          onClick={() => setShow2D(false)}
        >
          <div
            className="bg-white p-2 rounded-xl shadow-2xl transform transition-transform hover:scale-105"
            onClick={(e) => e.stopPropagation()}
          >
            <Smiles2D cid={molecule.cid} width={400} height={400} />
            <div className="text-center mt-2 text-slate-800 font-bold text-sm">
              Structuurformule
            </div>
          </div>
        </div>
      )}
      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={() => setShow2D(!show2D)}
          className="p-2 bg-white/10 text-white rounded hover:bg-white/20 transition-colors backdrop-blur-md"
        >
          <FileImage size={16} />
        </button>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 bg-red-500/20 text-red-500 rounded hover:bg-red-500 hover:text-white transition-colors backdrop-blur-md"
          >
            <X size={16} />
          </button>
        )}
      </div>
      {measureMode && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-yellow-500/90 text-black px-3 py-1 text-xs font-bold rounded-full animate-pulse z-10">
          Meetmodus Actief
        </div>
      )}

      {/* 3D Spatial Tag */}
      <div className="absolute bottom-4 right-4 text-[8px] font-black text-white/20 uppercase tracking-[0.2em] pointer-events-none">
        Spatial Engine Active // Live Source
      </div>
    </div>
  );
};

export const VisualizerStage: React.FC = () => {
  const [state, setState] = useModuleState<VisualizerState>("visualizer");
  const [compareMode, setCompareMode] = useState(false);
  const [measureMode, setMeasureMode] = useState(false);
  const [secondMolecule, setSecondMolecule] = useState<MoleculeData | null>(
    null,
  );

  useVoiceCoachContext(
    "ChemistryLab",
    `3D Visualisatie van ${state.molecule?.name || "moleculen"}.`,
    { activeModule: "visualizer", molecule: state.molecule?.name },
  );

  useEffect(() => {
    if (state.molecule && !state.analysis) {
      cascadeGenerate(
        `Korte chemische analyse van ${state.molecule.name} voor VWO niveau.`,
      ).then((res: { content: string }) =>
        setState((prev: VisualizerState) => ({
          ...prev,
          analysis: res.content,
        })),
      );
    }
  }, [state.molecule, state.analysis, setState]);

  const addSecondMolecule = () => {
    if (!state.molecule) return;
    setSecondMolecule(state.molecule);
  };

  return (
    <div className="h-full flex flex-col p-6 bg-obsidian-950 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] pointer-events-none select-none z-0">
        <h1 className="text-[12rem] font-black tracking-tighter text-white">
          VWO ELITE
        </h1>
      </div>

      <div className="flex justify-end gap-2 mb-4 relative z-10">
        <button
          onClick={() => setMeasureMode(!measureMode)}
          className={`btn-elite-glass btn-elite-amber !px-4 !py-2 !rounded-xl ${measureMode ? "active" : ""}`}
        >
          <Ruler size={16} />
          <span className="hidden md:inline">Meten</span>
        </button>
        <button
          onClick={() => {
            setCompareMode(!compareMode);
            if (!compareMode && !secondMolecule) addSecondMolecule();
          }}
          className={`btn-elite-glass btn-elite-cyan !px-4 !py-2 !rounded-xl ${compareMode ? "active" : ""}`}
        >
          <GitCompare size={16} />
          <span className="hidden md:inline">Vergelijken</span>
        </button>
      </div>

      <div className="flex-1 flex gap-4 min-h-0 relative z-10">
        <div
          className={`transition-all duration-500 ${compareMode ? "w-1/2" : "w-full"}`}
        >
          <MoleculeViewer
            id="mol-viewer-main"
            molecule={state.molecule}
            measureMode={measureMode}
          />
        </div>
        {compareMode && (
          <div className="w-1/2 flex flex-col gap-2 relative">
            <MoleculeViewer
              id="mol-viewer-compare"
              molecule={secondMolecule}
              measureMode={measureMode}
              onClose={() => setCompareMode(false)}
            />
            {!secondMolecule && (
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  onClick={addSecondMolecule}
                  className="btn-elite-glass btn-elite-cyan !px-5 !py-3 !rounded-xl active"
                >
                  <Plus size={16} /> Laad Molecuul
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {state.molecule && (
        <div className="mt-4 p-4 bg-obsidian-900/80 rounded-2xl border border-white/10 backdrop-blur-md max-h-48 overflow-y-auto relative z-10">
          <h4 className="text-xs font-bold text-cyan-400 uppercase mb-2 flex items-center gap-2">
            <Activity size={12} /> AI Analyse
          </h4>
          <p className="text-sm text-slate-300 leading-relaxed font-light">
            {state.analysis || "Analyseren..."}
          </p>
        </div>
      )}
    </div>
  );
};
