import { Plus, Trash2, Variable } from "lucide-react";
import React from "react";

import { useModuleState } from "../../../hooks/usePhysicsLabContext";
import { ModelConstant, ModelVariable } from "./types";

export const ModelParameters: React.FC = () => {
  const [moduleState, setModuleState] = useModuleState("modeling");

  const constants = (moduleState.constants || []) as ModelConstant[];
  const initialValues = (moduleState.initialValues || []) as ModelVariable[];

  const updateConstant = (
    idx: number,
    field: keyof ModelConstant,
    value: string | number,
  ) => {
    const newConstants = [...constants];
    newConstants[idx] = {
      ...newConstants[idx],
      [field]: value,
    } as ModelConstant;
    setModuleState({ ...moduleState, constants: newConstants });
  };

  const updateInitialValue = (
    idx: number,
    field: keyof ModelVariable,
    value: string | number,
  ) => {
    const newValues = [...initialValues];
    newValues[idx] = { ...newValues[idx], [field]: value } as ModelVariable;
    setModuleState({ ...moduleState, initialValues: newValues });
  };

  const addConstant = () => {
    setModuleState({
      ...moduleState,
      constants: [...constants, { symbol: "C", value: 1, unit: "-" }],
    });
  };

  const addVariable = () => {
    setModuleState({
      ...moduleState,
      initialValues: [
        ...initialValues,
        { symbol: "x", value: 0, isState: true },
      ],
    });
  };

  const removeConstant = (idx: number) => {
    const newConstants = [...constants];
    newConstants.splice(idx, 1);
    setModuleState({ ...moduleState, constants: newConstants });
  };

  const removeVariable = (idx: number) => {
    const newValues = [...initialValues];
    newValues.splice(idx, 1);
    setModuleState({ ...moduleState, initialValues: newValues });
  };

  const setTimeStep = (dt: number) => {
    setModuleState({ ...moduleState, dt });
  };

  const setDuration = (duration: number) => {
    setModuleState({ ...moduleState, duration });
  };

  return (
    <div className="flex flex-col gap-6 p-4 text-white">
      {/* Simulation Settings */}
      <div className="space-y-3">
        <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">
          Simulatie Instellingen
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 border border-white/5 rounded-lg p-2">
            <label className="block text-[10px] text-slate-400 mb-1">
              Tijdstap (dt)
            </label>
            <input
              type="number"
              step="0.01"
              value={moduleState.dt || 0.1}
              onChange={(e) => setTimeStep(parseFloat(e.target.value))}
              className="w-full bg-transparent text-sm font-mono text-cyan-400 focus:outline-none"
            />
          </div>
          <div className="bg-white/5 border border-white/5 rounded-lg p-2">
            <label className="block text-[10px] text-slate-400 mb-1">
              Duur (s)
            </label>
            <input
              type="number"
              value={moduleState.duration || 10}
              onChange={(e) => setDuration(parseFloat(e.target.value))}
              className="w-full bg-transparent text-sm font-mono text-cyan-400 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Constants Section */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">
            Constanten
          </h4>
          <button
            onClick={addConstant}
            className="p-1 hover:bg-white/10 rounded text-emerald-400"
          >
            <Plus size={14} />
          </button>
        </div>
        <div className="space-y-2">
          {constants.map((c, i) => (
            <div
              key={i}
              className="flex items-center gap-2 bg-white/5 border border-white/5 p-2 rounded-lg group"
            >
              <span className="text-slate-500 font-mono text-xs w-4">=</span>
              <input
                className="w-8 bg-transparent text-yellow-400 font-bold font-mono text-sm focus:outline-none text-right"
                value={c.symbol}
                onChange={(e) => updateConstant(i, "symbol", e.target.value)}
              />
              <span className="text-slate-500 font-mono text-xs">:</span>
              <input
                className="flex-1 bg-transparent text-white font-mono text-sm focus:outline-none"
                type="number"
                value={c.value}
                onChange={(e) =>
                  updateConstant(i, "value", parseFloat(e.target.value))
                }
              />
              <button
                onClick={() => removeConstant(i)}
                className="opacity-0 group-hover:opacity-100 text-red-400 p-1 hover:bg-red-400/10 rounded transition-all"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          {constants.length === 0 && (
            <div className="text-[10px] text-slate-600 italic">
              Geen constanten gedefinieerd
            </div>
          )}
        </div>
      </div>

      {/* Initial Values Section */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">
            Startwaarden
          </h4>
          <button
            onClick={addVariable}
            className="p-1 hover:bg-white/10 rounded text-emerald-400"
          >
            <Plus size={14} />
          </button>
        </div>
        <div className="space-y-2">
          {initialValues.map((v, i) => (
            <div
              key={i}
              className="flex items-center gap-2 bg-white/5 border border-white/5 p-2 rounded-lg group"
            >
              <Variable size={12} className="text-purple-400" />
              <input
                className="w-8 bg-transparent text-purple-400 font-bold font-mono text-sm focus:outline-none text-right"
                value={v.symbol}
                onChange={(e) =>
                  updateInitialValue(i, "symbol", e.target.value)
                }
              />
              <span className="text-slate-500 font-mono text-xs">_0 = </span>
              <input
                className="flex-1 bg-transparent text-white font-mono text-sm focus:outline-none"
                type="number"
                value={v.value}
                onChange={(e) =>
                  updateInitialValue(i, "value", parseFloat(e.target.value))
                }
              />
              <button
                onClick={() => removeVariable(i)}
                className="opacity-0 group-hover:opacity-100 text-red-400 p-1 hover:bg-red-400/10 rounded transition-all"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          {initialValues.length === 0 && (
            <div className="text-[10px] text-slate-600 italic">
              Geen variabelen gedefinieerd
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
