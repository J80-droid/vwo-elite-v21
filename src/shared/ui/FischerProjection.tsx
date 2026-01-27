/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any -- molecule and interaction types */
// Fischer Projection SVG Component
import { type Molecule } from "@shared/assets/data/molecules";
import {
  calculateFischerRS,
  FischerPos,
  GroupData,
} from "@shared/lib/stereochemistry";
import { RefreshCw } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

interface FischerProjectionProps {
  molecule: Molecule;
  size?: number;
  showLabels?: boolean;
  showRSLabel?: boolean;
  interactive?: boolean; // Enable click-to-swap
  onConfigChange?: (config: "R" | "S" | null) => void;
}

// Element colors (matching 3D view)
const ELEMENT_COLORS: Record<string, string> = {
  C: "#333333",
  H: "#888888",
  O: "#ff4444",
  N: "#4444ff",
  Cl: "#00cc00",
  Br: "#aa0000",
  F: "#88ff88",
  S: "#ffcc00",
};

export const FischerProjection: React.FC<FischerProjectionProps> = ({
  molecule,
  size = 200,
  showLabels = true,
  showRSLabel = true,
  interactive = false,
  onConfigChange,
}) => {
  const padding = size * 0.15;
  const usableSize = size - padding * 2;
  const cx = size / 2;
  const cy = size / 2;

  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  // Maps atomIndex -> CurrentPosition ('top' | 'right' | 'bottom' | 'left')
  // If empty, uses default 3D-derived positions.
  const [positionMap, setPositionMap] = useState<Record<number, FischerPos>>(
    {},
  );

  // Reset state when molecule changes
  useEffect(() => {
    setPositionMap({});
  }, [molecule.name]);

  // Get chiral center and its substituents
  const chiralIndex = molecule.chiralCenters[0];

  // --- Helper Scopes (Memoized to avoid re-calc on every render) ---
  const { connectedAtoms, baseMapping } = useMemo(() => {
    if (chiralIndex === undefined)
      return { connectedAtoms: [], baseMapping: {} };

    // Find connected atoms
    const connected = molecule.bonds
      .filter((b) => b.from === chiralIndex || b.to === chiralIndex)
      .map((b) => (b.from === chiralIndex ? b.to : b.from))
      .map((idx) => ({ idx, atom: molecule.atoms[idx]! }));

    // Base Mapping (3D derived)
    const mapping: Record<number, FischerPos> = {};
    const used = new Set<FischerPos>();

    connected.forEach(({ idx, atom }, i) => {
      const [x, y, z] = atom.position;
      const maxCoord = Math.max(Math.abs(x), Math.abs(y), Math.abs(z));
      let key: FischerPos;

      if (Math.abs(y) === maxCoord) key = y > 0 ? "top" : "bottom";
      else if (Math.abs(x) === maxCoord) key = x > 0 ? "right" : "left";
      else key = (["top", "right", "bottom", "left"] as FischerPos[])[i % 4]!;

      // Avoid collisions
      while (used.has(key)) {
        const keys = ["top", "right", "bottom", "left"] as const;
        key = keys[(keys.indexOf(key) + 1) % 4]!;
      }
      used.add(key);
      mapping[idx] = key;
    });

    return { connectedAtoms: connected, baseMapping: mapping };
  }, [molecule, chiralIndex]);

  // --- Current Layout Calculation ---
  // Merge base mapping with user overrides (swaps)
  const currentLayout = useMemo(() => {
    const layout: Record<FischerPos, { atom: any; idx: number } | null> = {
      top: null,
      right: null,
      bottom: null,
      left: null,
    } as any;

    connectedAtoms.forEach(({ idx, atom }) => {
      // Use override if exists, else base
      const pos = positionMap[idx] || baseMapping[idx] || "top";
      layout[pos] = { atom, idx };
    });
    return layout;
  }, [connectedAtoms, baseMapping, positionMap]);

  // --- R/S Calculation for Current View ---
  const currentConfig = useMemo(() => {
    if (
      !currentLayout.top ||
      !currentLayout.right ||
      !currentLayout.bottom ||
      !currentLayout.left ||
      chiralIndex === undefined
    )
      return null;

    // Convert to GroupData format for util
    const groupData: Record<FischerPos, GroupData> = {
      top: { id: 0, element: "", label: "" },
      right: { id: 0, element: "", label: "" },
      bottom: { id: 0, element: "", label: "" },
      left: { id: 0, element: "", label: "" },
    }; // Placeholder initialization

    (["top", "right", "bottom", "left"] as FischerPos[]).forEach((pos) => {
      const item = currentLayout[pos];
      if (item) {
        const label = getGroupLabel(molecule, item.idx, chiralIndex);
        groupData[pos] = {
          id: item.idx,
          element: item.atom.element,
          label: label,
        };
      }
    });

    return calculateFischerRS(groupData);
  }, [currentLayout, molecule, chiralIndex]);

  // Notify parent of config change
  useEffect(() => {
    if (onConfigChange) onConfigChange(currentConfig);
  }, [currentConfig, onConfigChange]);

  if (chiralIndex === undefined) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <text x={cx} y={cy} textAnchor="middle" fill="#6b7280" fontSize="12">
          Geen chiraal centrum
        </text>
      </svg>
    );
  }

  // --- Interactions ---
  const handleGroupClick = (idx: number) => {
    if (!interactive) return;

    if (selectedIdx === null) {
      setSelectedIdx(idx);
    } else if (selectedIdx === idx) {
      setSelectedIdx(null); // Toggle off
    } else {
      // Swap!
      const pos1 = positionMap[selectedIdx] || baseMapping[selectedIdx];
      const pos2 = positionMap[idx] || baseMapping[idx];

      if (!pos1 || !pos2) return;

      setPositionMap((prev) => ({
        ...prev,
        [selectedIdx]: pos2,
        [idx]: pos1,
      }));
      setSelectedIdx(null);
    }
  };

  const handleReset = () => {
    setPositionMap({});
    setSelectedIdx(null);
  };

  // --- Rendering Coords ---
  const positions = {
    top: { x: cx, y: padding + usableSize * 0.1 },
    bottom: { x: cx, y: size - padding - usableSize * 0.1 },
    left: { x: padding + usableSize * 0.1, y: cy },
    right: { x: size - padding - usableSize * 0.1, y: cy },
  };

  return (
    <div className="relative inline-block">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl transition-all duration-300"
      >
        {/* Title */}
        <text
          x={cx}
          y={padding * 0.6}
          textAnchor="middle"
          fill="#9ca3af"
          fontSize="10"
        >
          Fischer Projectie {interactive ? "(Klik om te wisselen)" : ""}
        </text>

        {/* Vertical line (backbone) */}
        <line
          x1={cx}
          y1={positions.top.y}
          x2={cx}
          y2={positions.bottom.y}
          stroke="#6b7280"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Horizontal line (toward viewer - bold) */}
        <line
          x1={positions.left.x}
          y1={cy}
          x2={positions.right.x}
          y2={cy}
          stroke="#6b7280"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Central carbon (chiral center) */}
        <circle
          cx={cx}
          cy={cy}
          r={size * 0.06}
          fill="#333333"
          stroke="#2563eb"
          strokeWidth="2"
        />
        <text
          x={cx}
          y={cy + 4}
          textAnchor="middle"
          fill="white"
          fontSize="12"
          fontWeight="bold"
        >
          C
        </text>

        {/* R/S Label (Real-time) */}
        {showRSLabel && currentConfig && (
          <g className="animate-in fade-in zoom-in duration-300">
            <rect
              x={cx + size * 0.08}
              y={cy - size * 0.12}
              width={size * 0.1}
              height={size * 0.08}
              rx="3"
              fill={currentConfig === "R" ? "#3b82f6" : "#8b5cf6"}
            />
            <text
              x={cx + size * 0.13}
              y={cy - size * 0.065}
              textAnchor="middle"
              fill="white"
              fontSize="10"
              fontWeight="bold"
            >
              ({currentConfig})
            </text>
          </g>
        )}

        {Object.entries(currentLayout).map(([key, item]) => {
          // Need to map key (pos) to coordinates
          if (!item) return null;
          const posKey = key as FischerPos;
          const posCoords = positions[posKey];
          const groupLabel = getGroupLabel(molecule, item.idx, chiralIndex);
          const color = ELEMENT_COLORS[item.atom.element] || "#888888";
          const isSelected = selectedIdx === item.idx;

          // Calculate label output
          const labelOffset = {
            top: { dx: 0, dy: -8, anchor: "middle" as const },
            bottom: { dx: 0, dy: 16, anchor: "middle" as const },
            left: { dx: -8, dy: 4, anchor: "end" as const },
            right: { dx: 8, dy: 4, anchor: "start" as const },
          }[posKey];

          return (
            <g
              key={item.idx}
              onClick={() => handleGroupClick(item.idx)}
              className={
                interactive
                  ? "cursor-pointer hover:opacity-80 transition-opacity"
                  : ""
              }
            >
              {/* Selection Halo */}
              {isSelected && (
                <circle
                  cx={posCoords.x}
                  cy={posCoords.y}
                  r={size * 0.06}
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                  className="animate-spin-slow"
                />
              )}

              {/* Atom circle */}
              <circle
                cx={posCoords.x}
                cy={posCoords.y}
                r={size * 0.04}
                fill={color}
                stroke={isSelected ? "white" : "#1e40af"}
                strokeWidth={isSelected ? 2 : 1.5}
              />

              {/* Group label */}
              {showLabels && (
                <text
                  x={posCoords.x + labelOffset.dx}
                  y={posCoords.y + labelOffset.dy}
                  textAnchor={labelOffset.anchor}
                  fill="white"
                  fontSize="11"
                  fontWeight="500"
                  style={{ textShadow: "0px 1px 2px rgba(0,0,0,0.8)" }}
                >
                  {groupLabel}
                </text>
              )}
            </g>
          );
        })}

        {/* Legend */}
        <g>
          <text
            x={size * 0.05}
            y={size - padding * 0.4}
            fill="#6b7280"
            fontSize="8"
            opacity={0.7}
          >
            ─ naar voor │ naar achter
          </text>
        </g>
      </svg>

      {/* Reset Button (Interactive Mode Only) */}
      {interactive && Object.keys(positionMap).length > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleReset();
          }}
          className="absolute top-2 right-2 p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white/70 hover:text-white transition-colors"
          title="Reset Posities"
        >
          <RefreshCw size={14} />
        </button>
      )}
    </div>
  );
};

// Start Helper Logic (Duplicated from original, slightly cleaned)
const getGroupLabel = (
  molecule: Molecule,
  atomIdx: number,
  chiralIndex: number,
): string => {
  const atom = molecule.atoms[atomIdx]!;
  const element = atom.element;

  // Find neighbors excluding chiral center
  const attached = molecule.bonds
    .filter((b) => b.from === atomIdx || b.to === atomIdx)
    .map((b) => (b.from === atomIdx ? b.to : b.from))
    .filter((idx) => idx !== chiralIndex);

  const hCount = attached.filter(
    (idx) => molecule.atoms[idx]?.element === "H",
  ).length;

  if (element === "C") {
    if (hCount === 3) return "CH₃";
    if (hCount === 2) return "CH₂";
    if (hCount === 1) return "CH";
    const oxygens = attached.filter(
      (idx) => molecule.atoms[idx]?.element === "O",
    );
    if (oxygens.length >= 2) return "COOH";
    if (oxygens.length === 1) return "CHO";
    return "R";
  }
  if (element === "O") return hCount >= 1 ? "OH" : "O";
  if (element === "N") return hCount === 2 ? "NH₂" : hCount === 1 ? "NH" : "N";
  if (element === "S") return hCount >= 1 ? "SH" : "S";

  return element;
};

export {};
