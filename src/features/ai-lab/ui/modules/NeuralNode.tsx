import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import React from "react";

export interface PillarData {
    id: string;
    label: string;
    icon: LucideIcon;
    color: string;
    angle: number;
}

interface NeuralNodeProps {
    pillar: PillarData;
    radius: number;
    isHovered: boolean;
    onHover: () => void;
    onLeave: () => void;
}

export const NeuralNode: React.FC<NeuralNodeProps> = ({
    pillar,
    radius,
    isHovered,
    onHover,
    onLeave
}) => {
    const rad = (pillar.angle * Math.PI) / 180;
    const x = Math.cos(rad) * radius;
    const y = Math.sin(rad) * radius;

    return (
        <motion.div
            className="absolute z-30"
            initial={{ opacity: 0, scale: 0 }}
            animate={{
                opacity: 1,
                scale: isHovered ? 1.2 : 1,
                x,
                y
            }}
            transition={{
                type: "spring",
                stiffness: 100,
                damping: 15,
                delay: pillar.angle / 720
            }}
            onMouseEnter={onHover}
            onMouseLeave={onLeave}
        >
            <div className={`group relative flex flex-col items-center cursor-pointer`}>
                {/* Connection Ring */}
                <div className={`absolute -inset-4 rounded-full border-2 border-transparent transition-all duration-500 ${isHovered ? 'scale-110 opacity-100 border-white/20' : 'scale-50 opacity-0'}`} />

                {/* The Node Icon */}
                <div className={`relative p-4 rounded-full bg-black/40 border border-white/5 backdrop-blur-md shadow-lg transition-all duration-300 ${isHovered ? 'bg-white/10 border-white/20 shadow-white/10' : ''}`}>
                    <pillar.icon size={22} className={`${pillar.color} ${isHovered ? 'brightness-125 scale-110' : ''} transition-all duration-500`} />

                    {/* Active indicator */}
                    <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
                </div>

                {/* Label */}
                <motion.span
                    className={`absolute top-full mt-3 text-[10px] font-bold tracking-[0.2em] uppercase whitespace-nowrap transition-colors ${isHovered ? 'text-white' : 'text-slate-500'}`}
                    animate={{ opacity: isHovered ? 1 : 0.6 }}
                >
                    {pillar.label}
                </motion.span>
            </div>
        </motion.div>
    );
};
