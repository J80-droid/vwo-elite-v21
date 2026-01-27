/* eslint-disable react-hooks/exhaustive-deps */
import {
  hexToHsv,
  HSV,
  hsvToHex,
  hsvToRgbString,
} from "@shared/utils/color";
import { ChevronDown } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  align?: "left" | "right";
}

const PRESETS = [
  "#EF4444",
  "#F97316",
  "#F59E0B",
  "#84CC16",
  "#10B981",
  "#06B6D4",
  "#3B82F6",
  "#6366F1",
  "#8B5CF6",
  "#D946EF",
  "#EC4899",
  "#FFFFFF",
];

export const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  label,
  align = "left",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Internal HSV state for smooth editing
  const [hsv, setHsv] = useState<HSV>(hexToHsv(value));
  const [isDraggingSat, setIsDraggingSat] = useState(false);
  const [isDraggingHue, setIsDraggingHue] = useState(false);

  const satRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);

  // Sync external value to internal HSV (only if not dragging, to avoid jitter)
  useEffect(() => {
    if (!isDraggingSat && !isDraggingHue) {
      setHsv(hexToHsv(value));
    }
  }, [value, isDraggingSat, isDraggingHue]);

  // Update external value when HSV changes
  const updateColor = (newHsv: HSV) => {
    setHsv(newHsv);
    onChange(hsvToHex(newHsv));
  };

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Handle Saturation/Value Drag
  const handleSatMove = useCallback(
    (e: MouseEvent | React.MouseEvent) => {
      if (!satRef.current) return;
      const rect = satRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

      updateColor({
        ...hsv,
        s: Math.round(x * 100),
        v: Math.round((1 - y) * 100),
      });
    },
    [hsv],
  );

  // Handle Hue Drag
  const handleHueMove = useCallback(
    (e: MouseEvent | React.MouseEvent) => {
      if (!hueRef.current) return;
      const rect = hueRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));

      updateColor({
        ...hsv,
        h: Math.round(x * 360),
      });
    },
    [hsv],
  );

  // Global Mouse Up / Move for dragging
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (isDraggingSat) handleSatMove(e);
      if (isDraggingHue) handleHueMove(e);
    };
    const handleUp = () => {
      setIsDraggingSat(false);
      setIsDraggingHue(false);
    };

    if (isDraggingSat || isDraggingHue) {
      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [isDraggingSat, isDraggingHue, handleSatMove, handleHueMove]);

  return (
    <div className="relative z-20" ref={containerRef}>
      {label && (
        <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1 font-bold">
          {label}
        </label>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-10 rounded-lg flex items-center justify-between px-3 border transition-all duration-200 group ${isOpen
            ? "border-indigo-500/50 bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
            : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
          }`}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className="w-6 h-6 rounded-md shadow-sm border border-white/10 relative z-10"
              style={{ backgroundColor: value }}
            />
            <div
              className="absolute inset-0 rounded-md blur-sm opacity-50"
              style={{ backgroundColor: value }}
            />
          </div>
          <span className="text-xs font-mono text-slate-300 group-hover:text-white uppercase transition-colors">
            {value}
          </span>
        </div>
        <ChevronDown
          size={14}
          className={`text-slate-500 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute bottom-full mb-3 w-72 bg-slate-950/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] p-4 z-50 animate-in fade-in zoom-in-95 duration-200 ${align === "right"
              ? "right-0 origin-bottom-right"
              : "left-0 origin-bottom-left"
            }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Editor
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                value={value.replace("#", "")}
                onChange={(e) => {
                  const val = "#" + e.target.value;
                  if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                    onChange(val);
                    setHsv(hexToHsv(val));
                  }
                }}
                className="w-20 bg-black/40 border border-white/10 rounded px-2 py-1 text-xs font-mono text-white text-center focus:border-indigo-500 outline-none uppercase"
                maxLength={6}
              />
            </div>
          </div>

          {/* Saturation Area */}
          <div
            ref={satRef}
            className="w-full h-40 rounded-xl mb-4 relative cursor-crosshair overflow-hidden shadow-inner border border-white/10"
            style={{
              backgroundColor: hsvToRgbString({ h: hsv.h, s: 100, v: 100 }),
            }}
            onMouseDown={(e) => {
              setIsDraggingSat(true);
              handleSatMove(e);
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />

            {/* Cursor */}
            <div
              className="absolute w-4 h-4 rounded-full border-2 border-white shadow-[0_0_5px_rgba(0,0,0,0.5)] -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-transform active:scale-125"
              style={{
                left: `${hsv.s}%`,
                top: `${100 - hsv.v}%`,
                backgroundColor: value,
              }}
            />
          </div>

          {/* Hue Slider */}
          <div
            ref={hueRef}
            className="w-full h-4 rounded-full mb-6 relative cursor-pointer shadow-inner border border-white/10"
            style={{
              background:
                "linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)",
            }}
            onMouseDown={(e) => {
              setIsDraggingHue(true);
              handleHueMove(e);
            }}
          >
            <div
              className="absolute w-4 h-4 rounded-full border-2 border-white bg-white shadow-sm -translate-x-1/2 top-0"
              style={{ left: `${(hsv.h / 360) * 100}%` }}
            />
          </div>

          {/* Presets Grid */}
          <div className="grid grid-cols-6 gap-2">
            {PRESETS.map((color) => (
              <button
                key={color}
                onClick={() => {
                  onChange(color);
                  setHsv(hexToHsv(color));
                }}
                className={`w-8 h-8 rounded-full transition-all hover:scale-110 relative group ${value.toLowerCase() === color.toLowerCase()
                    ? "border-2 border-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                    : "border border-white/10 hover:border-white/50"
                  }`}
                style={{ backgroundColor: color }}
              >
                <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
