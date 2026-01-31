import React from "react";
import { Brain } from "lucide-react";
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts";
import { CardWrapper } from "./CardWrapper";
import { RTTIDataPoint } from "../types";

interface RTTICardProps {
    data: RTTIDataPoint[];
}

export const RTTICard: React.FC<RTTICardProps> = ({ data }) => {
    const hasData = data.length > 0;
    const skeletonData = [
        { subject: 'Reproductie', A: 80, fullMark: 100 },
        { subject: 'Training', A: 60, fullMark: 100 },
        { subject: 'Toepassing', A: 40, fullMark: 100 },
        { subject: 'Inzicht', A: 20, fullMark: 100 },
    ];

    return (
        <CardWrapper
            neonColor="purple"
            className="p-8 h-full flex flex-col"
            description="RTTI Analyse: Reproductie (R), Training (T1), Toepassing (T2) en Inzicht (I). Ontdek of je vastloopt op feitenkennis of juist op complexe integratie."
        >
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                    <Brain size={16} />
                </div>
                <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                    Cognitieve Analyse (RTTI)
                </h3>
            </div>

            <div className="flex-1 w-full min-h-[350px] relative">
                {!hasData && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/20 backdrop-blur-[2px] rounded-xl">
                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest text-center px-6">
                            Meer data nodig voor<br />cognitief profiel...
                        </p>
                    </div>
                )}
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={hasData ? data : skeletonData}>
                        <PolarGrid stroke="#1e293b" strokeDasharray="4 4" opacity={0.3} />
                        <PolarAngleAxis
                            dataKey="subject"
                            tick={{ fill: '#64748b', fontSize: 9, fontWeight: 900 }}
                        />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} hide />
                        <Radar
                            name="Mastery"
                            dataKey="A"
                            stroke="#a855f7"
                            fill="#a855f7"
                            fillOpacity={0.2}
                            strokeWidth={3}
                            className={hasData ? "drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]" : "opacity-10"}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(2, 6, 23, 0.9)',
                                borderRadius: '12px',
                                border: '1px solid rgba(255,255,255,0.05)',
                                backdropFilter: 'blur(8px)',
                                fontSize: '11px'
                            }}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        </CardWrapper>
    );
};
