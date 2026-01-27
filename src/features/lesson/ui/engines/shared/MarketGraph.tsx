import { InteractiveComponentSchema } from "@shared/types/lesson.schema";
import React from "react";
import { z } from "zod";

type InteractiveComponent = z.infer<typeof InteractiveComponentSchema>;
type ComponentConfig<T extends InteractiveComponent['type']> = Extract<InteractiveComponent, { type: T }>['config'];

export const MarketGraph: React.FC<{
    config: ComponentConfig<"market-graph">;
    mastery?: 'novice' | 'competent' | 'expert';
}> = ({ config, mastery }) => (
    <div className="bg-obsidian-950 border border-gold/30 rounded-xl p-6 relative">
        {mastery === 'novice' && <div className="absolute top-2 right-4 bg-blue-500/20 text-blue-400 text-[10px] px-2 py-0.5 rounded-full">Eenvoudig Model</div>}
        <h4 className="text-gold mb-4 font-serif">Market Equilibrium</h4>
        <div className="h-64 border-l border-b border-slate-600 relative bg-slate-900/50">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <line x1="0" y1="100" x2="100" y2="0" stroke="#3b82f6" strokeWidth="2" />
                <line x1="0" y1="20" x2="100" y2="80" stroke="#ef4444" strokeWidth="2" />
                {config.equilibrium && mastery !== 'novice' && <circle cx="50" cy="50" r="2" fill="white" />}
            </svg>
        </div>
        <div className="mt-4 flex gap-4 text-xs text-slate-400">
            {config.lines.map((line, i) => (
                <div key={i} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${i === 0 ? "bg-blue-500" : "bg-red-500"}`} />
                    <span>{line.label} ({line.equation})</span>
                </div>
            ))}
        </div>
    </div>
);
