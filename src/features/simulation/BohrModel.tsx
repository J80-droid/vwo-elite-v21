import { motion } from "framer-motion";
import React from "react";

interface BohrModelProps {
  symbol: string;
  shells: number[];
  color: string;
  size?: number;
}

export const BohrModel: React.FC<BohrModelProps> = ({
  symbol,
  shells,
  color,
  size = 200,
}) => {
  const center = size / 2;
  const maxShells = shells.length;
  const shellStep = (size / 2 - 20) / maxShells;

  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Nucleus */}
        <circle
          cx={center}
          cy={center}
          r={12}
          fill={color}
          className="opacity-20 blur-sm"
        />
        <circle
          cx={center}
          cy={center}
          r={8}
          fill={color}
          className="shadow-inner"
        />
        <text
          x={center}
          y={center}
          dominantBaseline="central"
          textAnchor="middle"
          fill="white"
          fontSize="10"
          fontWeight="bold"
          className="pointer-events-none"
        >
          {symbol}
        </text>

        {/* Shells */}
        {shells.map((electronCount, shellIdx) => {
          const radius = 20 + (shellIdx + 1) * shellStep;
          return (
            <g key={`shell-${shellIdx}`}>
              {/* Path */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="white"
                strokeWidth="0.5"
                className="opacity-10"
              />

              {/* Electrons */}
              {[...Array(electronCount)].map((_, eIdx) => {
                const angleStep = (Math.PI * 2) / electronCount;
                const startAngle = eIdx * angleStep;

                return (
                  <motion.circle
                    key={`e-${shellIdx}-${eIdx}`}
                    r={2.5}
                    fill={color}
                    animate={{
                      cx: [
                        center + radius * Math.cos(startAngle),
                        center + radius * Math.cos(startAngle + Math.PI * 2),
                      ],
                      cy: [
                        center + radius * Math.sin(startAngle),
                        center + radius * Math.sin(startAngle + Math.PI * 2),
                      ],
                    }}
                    transition={{
                      duration: 10 + shellIdx * 5,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    style={{ filter: `drop-shadow(0 0 4px ${color})` }}
                  />
                );
              })}
            </g>
          );
        })}
      </svg>

      {/* Shell Labels (K, L, M...) */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-2 px-2 pb-1 bg-slate-900/40 backdrop-blur-sm rounded-xl border border-white/5 translate-y-4">
        {shells.map((count, i) => (
          <div key={i} className="flex flex-col items-center">
            <span className="text-[8px] text-slate-500 uppercase">
              {String.fromCharCode(75 + i)}
            </span>
            <span className="text-xs font-mono font-bold text-white">
              {count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
