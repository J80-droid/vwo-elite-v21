import { useTranslations } from "@shared/hooks/useTranslations";
import { Grid3x3, Minus, Plus, Trash2 } from "lucide-react";
import React from "react";

interface MatrixEditorProps {
  value: number[][];
  onChange: (matrix: number[][]) => void;
  label?: string;
  color?: string;
  readOnly?: boolean;
}

export const MatrixEditor: React.FC<MatrixEditorProps> = ({
  value,
  onChange,
  label = "Matrix",
  color = "#60a5fa", // blue-400
  readOnly = false,
}) => {
  const { t } = useTranslations();
  const rows = value.length;
  const cols = value[0]?.length || 0;

  const handleResize = (newRows: number, newCols: number) => {
    if (newRows < 1 || newRows > 5 || newCols < 1 || newCols > 5) return;

    const newMatrix = Array(newRows)
      .fill(0)
      .map((_, r) =>
        Array(newCols)
          .fill(0)
          .map((_, c) => value[r]?.[c] || 0),
      );
    onChange(newMatrix);
  };

  const handleCellChange = (r: number, c: number, val: string) => {
    const num = parseFloat(val);
    const newMatrix = value.map((row) => [...row]);
    newMatrix[r]![c] = isNaN(num) ? 0 : num;
    onChange(newMatrix);
  };

  const handleIdentity = () => {
    // Force square for Identity - User workflow: Resize to NxN -> Identity.
    const newMatrix = Array(rows)
      .fill(0)
      .map((_, r) =>
        Array(cols)
          .fill(0)
          .map((_, c) => (r === c ? 1 : 0)),
      );
    onChange(newMatrix);
  };

  const handleClear = () => {
    const newMatrix = Array(rows)
      .fill(0)
      .map(() => Array(cols).fill(0));
    onChange(newMatrix);
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-sm">
      {/* Header / Toolbar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Grid3x3 size={14} style={{ color }} />
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color }}
          >
            {label === "Matrix A"
              ? t("calculus.matrix.label_a")
              : label === "Matrix B"
                ? t("calculus.matrix.label_b")
                : label}{" "}
            <span className="text-slate-500 text-[10px] ml-1">
              ({rows}×{cols})
            </span>
          </span>
        </div>

        {!readOnly && (
          <div className="flex items-center gap-1">
            <button
              onClick={handleIdentity}
              className="p-1.5 text-[10px] font-bold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded uppercase tracking-wider transition-colors"
              title="Set Identity"
            >
              ID
            </button>
            <button
              onClick={handleClear}
              className="p-1.5 text-slate-500 hover:text-red-400 bg-white/5 hover:bg-white/10 rounded transition-colors"
              title={t("common.delete")}
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Editor Grid */}
      <div className="flex flex-col gap-1 items-center">
        {/* Top Row Controls (Columns) */}
        {!readOnly && (
          <div className="flex gap-1 mb-1">
            <button
              onClick={() => handleResize(rows, cols - 1)}
              disabled={cols <= 1}
              className="w-6 h-6 flex items-center justify-center rounded bg-black/20 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent text-slate-400"
            >
              <Minus size={12} />
            </button>
            <span className="text-[10px] uppercase text-slate-500 font-bold self-center">
              {t("calculus.matrix.cols")}
            </span>
            <button
              onClick={() => handleResize(rows, cols + 1)}
              disabled={cols >= 5}
              className="w-6 h-6 flex items-center justify-center rounded bg-black/20 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent text-slate-400"
            >
              <Plus size={12} />
            </button>
          </div>
        )}

        <div className="flex gap-1 items-stretch">
          {/* Left Col Controls (Rows) */}
          {!readOnly && (
            <div className="flex flex-col gap-1 justify-center mr-1">
              <button
                onClick={() => handleResize(rows - 1, cols)}
                disabled={rows <= 1}
                className="w-6 h-6 flex items-center justify-center rounded bg-black/20 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent text-slate-400"
              >
                <Minus size={12} />
              </button>
              <span className="text-[10px] uppercase text-slate-500 font-bold self-center -rotate-90">
                {t("calculus.matrix.rows")}
              </span>
              <button
                onClick={() => handleResize(rows + 1, cols)}
                disabled={rows >= 5}
                className="w-6 h-6 flex items-center justify-center rounded bg-black/20 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent text-slate-400"
              >
                <Plus size={12} />
              </button>
            </div>
          )}

          {/* The Inputs */}
          <div
            className="grid gap-1 bg-black/40 p-2 rounded-lg border border-white/5 shadow-inner"
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(40px, 1fr))`,
            }}
          >
            {value.map((row, r) =>
              row.map((val, c) => (
                <input
                  key={`${r}-${c}`}
                  type="number"
                  value={val}
                  onChange={(e) => handleCellChange(r, c, e.target.value)}
                  readOnly={readOnly}
                  className={`
                                        w-full bg-transparent text-center font-mono text-sm py-1.5 rounded outline-none border border-transparent
                                        ${readOnly ? "text-slate-300" : "text-indigo-300 hover:bg-white/5 focus:bg-white/10 focus:border-indigo-500/50"}
                                        transition-all
                                    `}
                />
              )),
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
