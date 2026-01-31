import React from "react";

export const SolutionSkeleton: React.FC = () => {
    return (
        <div className="space-y-4 animate-pulse">
            {/* Header simulatie */}
            <div className="h-4 bg-amber-500/20 rounded w-1/4 mb-6" />

            {/* Stap 1 */}
            <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-white/5 rounded w-3/4" />
                    <div className="h-4 bg-white/5 rounded w-1/2" />
                </div>
            </div>

            {/* Stap 2 */}
            <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-white/5 rounded w-5/6" />
                    <div className="h-3 bg-white/5 rounded w-1/3" />
                </div>
            </div>

            {/* Conclusie */}
            <div className="mt-6 p-4 rounded-xl bg-black/20 border border-white/5 h-24" />
        </div>
    );
};
