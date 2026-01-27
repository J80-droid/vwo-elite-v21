import React, { useRef, useState } from "react";

import { HR_MAX_L, HR_MAX_T, HR_MIN_L, HR_MIN_T } from "./astroMath";

interface Props {
  temp: number;
  luminosity: number;
  onChange: (t: number, l: number) => void;
}

export const HRDiagram: React.FC<Props> = ({ temp, luminosity, onChange }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Constants
  const minT = HR_MIN_T,
    maxT = HR_MAX_T;
  const minL = HR_MIN_L,
    maxL = HR_MAX_L;

  // Logic
  const getCoords = (t: number, l: number, width: number, height: number) => {
    const logT = Math.log10(t);
    const logMinT = Math.log10(minT);
    const logMaxT = Math.log10(maxT);

    // Logarithmic scale for Luminosity
    const logL = l; // Expecting logL from state
    const logMinL = Math.log10(minL);
    const logMaxL = Math.log10(maxL);

    const x = width * (1 - (logT - logMinT) / (logMaxT - logMinT));
    const y = height * (1 - (logL - logMinL) / (logMaxL - logMinL));
    return { x, y };
  };

  const handleInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    let clientX, clientY;
    if ("touches" in e && e.touches.length > 0) {
      const touch = e.touches[0];
      if (!touch) return;
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const xPct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const yPct = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

    const logMaxT = Math.log10(maxT);
    const logMinT = Math.log10(minT);
    const logMaxL = Math.log10(maxL);
    const logMinL = Math.log10(minL);

    const logT = logMaxT - xPct * (logMaxT - logMinT);
    const newT = Math.pow(10, logT);

    // Y is logL
    const newLogL = logMinL + (1 - yPct) * (logMaxL - logMinL);

    onChange(newT, newLogL);
  };

  const { x, y } = getCoords(temp, luminosity, 300, 225);

  return (
    <div className="w-full h-full relative overflow-hidden select-none cursor-crosshair">
      {/* Background - Minimalistic */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <svg width="100%" height="100%" preserveAspectRatio="none">
          <defs>
            <linearGradient id="msGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>
          <path
            d="M 0,0 Q 150,112.5 300,225"
            stroke="url(#msGradient)"
            strokeWidth="80"
            strokeLinecap="round"
            filter="blur(40px)"
            opacity="0.5"
            transform="scale(1,1)"
          />
        </svg>
      </div>

      {/* Axis Labels */}
      <div className="absolute bottom-2 left-0 right-0 text-center text-[9px] text-slate-600 font-bold uppercase tracking-widest pointer-events-none">
        Temperature (K)
      </div>
      <div className="absolute left-2 top-0 bottom-0 flex items-center pointer-events-none">
        <span className="text-[9px] text-slate-600 font-bold uppercase -rotate-90 tracking-widest">
          Luminosity (L☉)
        </span>
      </div>

      {/* Interactive Layer */}
      <svg
        ref={svgRef}
        viewBox="0 0 300 225"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full z-10"
        onMouseDown={(e) => {
          setIsDragging(true);
          handleInteraction(e);
        }}
        onMouseMove={(e) => isDragging && handleInteraction(e)}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onTouchStart={(e) => {
          setIsDragging(true);
          handleInteraction(e);
        }}
        onTouchMove={(e) => isDragging && handleInteraction(e)}
        onTouchEnd={() => setIsDragging(false)}
      >
        <line
          x1={x}
          y1={y}
          x2={x}
          y2={225}
          stroke="white"
          strokeDasharray="3 3"
          opacity="0.4"
        />
        <line
          x1={x}
          y1={y}
          x2={0}
          y2={y}
          stroke="white"
          strokeDasharray="3 3"
          opacity="0.4"
        />
        <circle
          cx={x}
          cy={y}
          r="5"
          fill="white"
          stroke="black"
          strokeWidth="1"
        />
      </svg>

      {/* Value Overlay */}
      <div className="absolute top-4 right-4 text-right pointer-events-none">
        <div className="text-xl font-bold text-white font-mono tracking-tighter drop-shadow-md">
          {temp.toFixed(0)} <span className="text-sm text-slate-400">K</span>
        </div>
        <div className="text-xs text-fuchsia-400 font-mono font-bold">
          10<sup className="text-[9px]">{luminosity.toFixed(1)}</sup> L☉
        </div>
      </div>
    </div>
  );
};
