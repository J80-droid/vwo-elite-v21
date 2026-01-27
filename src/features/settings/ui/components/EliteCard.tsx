import { cn } from "@shared/lib/utils";
import { motion } from "framer-motion";
import React from "react";

interface EliteCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  glowColor?: string;
  onClick?: () => void;
}

export const EliteCard: React.FC<EliteCardProps> = ({
  children,
  className = "",
  delay = 0,
  glowColor = "blue",
  onClick,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    onClick={onClick}
    className={cn(
      `
            relative overflow-hidden
            bg-zinc-950/50 backdrop-blur-xl
            border border-white/5
            rounded-2xl p-6
            group
            hover:shadow-[0_0_30px_-5px_var(--glow-color)]
            transition-all duration-500
            cursor-pointer
            `,
      className,
    )}
    style={
      {
        "--glow-color": `rgba(var(--color-${glowColor}-500), 0.1)`,
        borderColor: `rgba(var(--color-${glowColor}-500), 0.1)`,
      } as React.CSSProperties
    }
  >
    <div className="relative z-10">{children}</div>
    {/* Subtle Gradient Overlay */}
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
  </motion.div>
);
