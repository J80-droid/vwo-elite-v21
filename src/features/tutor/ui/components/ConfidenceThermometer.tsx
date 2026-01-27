import { motion } from "framer-motion";
import React from "react";

interface ConfidenceThermometerProps {
  score: number; // 0.0 to 1.0
  className?: string;
}

export const ConfidenceThermometer: React.FC<ConfidenceThermometerProps> = ({
  score,
  className,
}) => {
  // Determine color and label based on score
  let color = "bg-red-500";
  let label = "Uncertain";
  const width = `${(score * 100).toFixed(0)}%`;

  if (score > 0.8) {
    color = "bg-emerald-500";
    label = "High Confidence";
  } else if (score > 0.5) {
    color = "bg-amber-500";
    label = "Moderate Confidence";
  } else {
    color = "bg-red-500";
    label = "Low Confidence";
  }

  return (
    <div className={`flex items-center gap-2 group ${className}`}>
      {/* Bar Container */}
      <div className="h-1.5 w-16 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full rounded-full ${color} shadow-[0_0_8px_rgba(255,255,255,0.2)]`}
        />
      </div>

      {/* Label (Reveal on Hover) */}
      <span
        className={`text-[10px] font-medium tracking-wide uppercase transition-colors duration-300
        ${score > 0.8 ? "text-emerald-400" : score > 0.5 ? "text-amber-400" : "text-red-400"}
        opacity-60 group-hover:opacity-100
      `}
      >
        {label}
      </span>
    </div>
  );
};
