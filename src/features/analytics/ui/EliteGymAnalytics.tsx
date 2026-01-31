import { Brain, ChevronRight, Zap } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { GYM_CATALOG } from "@features/math/ui/modules/gym/config/gymCatalog";
import { GymRepository } from "@shared/api/repositories/GymRepository";

// Internal Components
import { BenchmarkCard } from "../components/BenchmarkCard";
import { ConfidenceMatrixCard } from "../components/ConfidenceMatrixCard";
import { ErrorDNACard } from "../components/ErrorDNACard";
import { ExamReadinessCard } from "../components/ExamReadinessCard";
import { FocusWellnessCard } from "../components/FocusWellnessCard";
import { KnowledgeMap } from "../components/KnowledgeMap";
import { PointsToGainCard } from "../components/PointsToGainCard";
import { PredictedGradeCard } from "../components/PredictedGradeCard";
import { RTTICard } from "../components/RTTICard";
import { RetentionCard } from "../components/RetentionCard";
import { StaminaTrackerCard } from "../components/StaminaTrackerCard";
import { SyllabusCard } from "../components/SyllabusCard";
import { TimeAnalysisCard } from "../components/TimeAnalysisCard";
import { TrajectoryCard } from "../components/TrajectoryCard";
import { AnalyticsUIContext } from "../context/AnalyticsContext";

// Mappers & Types
import { mapConfidenceData, mapErrorData, mapSyllabusData } from "../mappers";
import {
    BenchmarkItem,
    ConfidencePoint,
    ErrorDNAItem,
    MentalState,
    RetentionData,
    RTTIDataPoint,
    SyllabusItem,
    TrajectoryPoint,
    WPMData
} from "../types";

export const EliteGymAnalytics: React.FC = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [showTooltips, setShowTooltips] = useState(true);

    // Data States
    const [readiness, setReadiness] = useState({ grade: "1.0", percentage: 0 });
    const [percentile, setPercentile] = useState(50);
    const [wpmData, setWPMData] = useState<WPMData>([]);
    const [trajectoryData, setTrajectoryData] = useState<TrajectoryPoint[]>([]);
    const [errorData, setErrorData] = useState<ErrorDNAItem[]>([]);
    const [syllabusData, setSyllabusData] = useState<SyllabusItem[]>([]);
    const [confidenceData, setConfidenceData] = useState<ConfidencePoint[]>([]);
    const [levelMap, setLevelMap] = useState<Record<string, number>>({});
    const [timeData, setTimeData] = useState<{ name: string; time: number }[]>([]);
    const [staminaData, setStaminaData] = useState<{ index: number; accuracy: number }[]>([]);
    const [rttiData, setRTTIData] = useState<RTTIDataPoint[]>([]);
    const [retentionData, setRetentionData] = useState<RetentionData>({ overall: 0, segments: [] });
    const [pointsData, setPointsData] = useState<{ id: string, potential: number, acc: number, level: number }[]>([]);
    const [mentalState, setMentalState] = useState<MentalState>({ focusScore: 100, burnoutRisk: 'Low', volume24h: 0 });
    const [benchmarkData, setBenchmarkData] = useState<BenchmarkItem[]>([]);
    const [prediction, setPrediction] = useState({ grade: 1.0, breakdown: { accuracy: 0, coverage: 0, stamina: 0 } });

    useEffect(() => {
        const fetchCriticalData = async () => {
            try {
                // 1. Critical Data (Above the fold / KPI)
                const criticalResults = await Promise.allSettled([
                    GymRepository.getPredictedGradeStats(), // 0
                    GymRepository.getSyllabusLevels(),      // 1
                    GymRepository.getMonthlyTrend()         // 2
                ]);

                function getVal<T>(res: PromiseSettledResult<T>, defaultVal: T): T {
                    return res.status === 'fulfilled' ? res.value : defaultVal;
                }

                const gradeStats = getVal(criticalResults[0], { grade: 1.0, breakdown: { accuracy: 0, coverage: 0, stamina: 0 } });
                const levels = getVal<{ engine_id: string; box_level: number }[]>(criticalResults[1], []);
                const trend = getVal<{ month_key: string; avg_grade: number }[]>(criticalResults[2], []);

                // Process Critical Data
                setPrediction(gradeStats);

                const pScore = await GymRepository.getPercentileScore(gradeStats.grade);
                setPercentile(pScore);

                const syllabus = mapSyllabusData(levels);
                setSyllabusData(syllabus);

                const mappedTrend: TrajectoryPoint[] = trend.map((t) => ({
                    month: new Date(t.month_key).toLocaleString('default', { month: 'short' }),
                    grade: parseFloat(t.avg_grade.toFixed(1))
                }));
                if (mappedTrend.length > 1) {
                    const lastGrade = mappedTrend[mappedTrend.length - 1]?.grade || 5.0;
                    mappedTrend.push({ month: "Proj.", grade: lastGrade, projected: Math.min(10, lastGrade + 0.5) });
                }
                setTrajectoryData(mappedTrend);

                const relevantModules = GYM_CATALOG.filter((m) => !m.isSpecial);
                const lvlMap: Record<string, number> = levels.reduce((acc: Record<string, number>, curr) => ({ ...acc, [curr.engine_id]: curr.box_level }), {});
                setLevelMap(lvlMap);

                let totalPoints = 0;
                relevantModules.forEach(m => totalPoints += (lvlMap[m.id] || 1));
                const pct = Math.round((totalPoints / (relevantModules.length * 5)) * 100);
                setReadiness({ grade: (1 + (pct / 100) * 9).toFixed(1), percentage: pct });

                // Unlock Critical UI
                setIsLoading(false);

                // 2. Secondary Data (Below the fold)
                fetchSecondaryData();

            } catch (err) {
                console.error("Critical Load Failed", err);
                setIsLoading(false); // Fail gracefully
            }
        };

        const fetchSecondaryData = async () => {
            const results = await Promise.allSettled([
                GymRepository.getErrorDistribution(),       // 0
                GymRepository.getConfidenceStats(),         // 1
                GymRepository.getTimeStats(5),              // 2
                GymRepository.getStaminaStats(200),         // 3
                GymRepository.getRTTIStats(),               // 4
                GymRepository.getRetentionStats(),          // 5
                GymRepository.getPointsToGainStats(),       // 6
                GymRepository.getMentalStateStats(),        // 7
                GymRepository.getBenchmarkStats(),          // 8
                GymRepository.getWPMStats()                 // 9
            ]);

            function getVal<T>(res: PromiseSettledResult<T>, defaultVal: T): T {
                return res.status === 'fulfilled' ? res.value : defaultVal;
            }

            setErrorData(mapErrorData(getVal(results[0], [])));
            setConfidenceData(mapConfidenceData(getVal(results[1], [])));

            const timeStats = getVal<{ engine_id: string; avg_time: number }[]>(results[2], []);
            setTimeData(timeStats.map(ts => ({
                name: GYM_CATALOG.find(m => m.id === ts.engine_id)?.title || ts.engine_id,
                time: Math.round(ts.avg_time / 1000)
            })));

            setStaminaData(getVal(results[3], []));
            setRTTIData(getVal(results[4], []));
            setRetentionData(getVal(results[5], { overall: 0, segments: [] }));
            setPointsData(getVal(results[6], []));
            setMentalState(getVal(results[7], { focusScore: 100, burnoutRisk: 'Low', volume24h: 0 }));
            setBenchmarkData(getVal(results[8], []));
            setWPMData(getVal(results[9], []));
        };

        fetchCriticalData();
    }, []);

    const startSmartWorkout = () => {
        const candidates = GYM_CATALOG.filter(m => !m.isSpecial).sort((a, b) => {
            const lvlA = levelMap[a.id] || 1;
            const lvlB = levelMap[b.id] || 1;
            return lvlA - lvlB;
        });

        if (candidates.length > 0 && candidates[0]) {
            const targetId = candidates[0].id;
            navigate(`/math-modern/gym/${targetId}`);
        }
    };

    if (isLoading) return (
        <div className="p-12 h-[600px] flex flex-col items-center justify-center gap-6">
            <div className="w-12 h-12 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            <div className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">
                Metrics Synchroniseren...
            </div>
        </div>
    );

    return (
        <AnalyticsUIContext.Provider value={{ showTooltips }}>
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-24 max-w-[1400px] mx-auto">
                {/* Minimal Header */}
                <div className="flex items-center justify-between group">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-4">
                            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all duration-500">
                                <Brain size={24} />
                            </div>
                            GOD MODE ANALYTICS
                        </h2>
                        <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest pl-14">
                            Real-time geaggregeerde intelligence.
                        </p>
                    </div>

                    {/* Visual Accent & Tools */}
                    <div className="flex flex-col items-end gap-2">
                        <div className="hidden md:flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            <span className="text-[10px] font-black text-slate-500 tracking-widest uppercase">Live System Active</span>
                        </div>
                        {/* Tooltip Toggle */}
                        <button
                            onClick={() => setShowTooltips(!showTooltips)}
                            className="flex items-center gap-2 group/toggle cursor-pointer"
                            title={showTooltips ? "Verberg uitleg tooltips" : "Toon uitleg tooltips"}
                        >
                            <div className={`w-8 h-4 rounded-full border border-white/10 relative transition-all duration-300 ${showTooltips ? 'bg-indigo-500/20 border-indigo-500/30' : 'bg-slate-900'}`}>
                                <div className={`absolute top-0.5 left-0.5 w-2.5 h-2.5 rounded-full transition-all duration-300 ${showTooltips ? 'translate-x-4 bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'translate-x-0 bg-slate-600'}`} />
                            </div>
                            <span className={`text-[9px] font-bold uppercase tracking-widest transition-colors ${showTooltips ? 'text-indigo-400' : 'text-slate-600'}`}>
                                Hints {showTooltips ? 'ON' : 'OFF'}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Layout Grid Tier 1: Focus Metrics - Stacked left 1/3, graph right 2/3 */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column: Stacked items (1/3 width) */}
                    <div className="lg:col-span-4 flex flex-col gap-6">
                        <PredictedGradeCard grade={prediction.grade} percentile={percentile} breakdown={prediction.breakdown} />

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6">
                            <ExamReadinessCard grade={readiness.grade} percentage={readiness.percentage} />

                            {/* Smart Workout: Focus Button Style (Vertically compacted) */}
                            <button
                                onClick={startSmartWorkout}
                                className="relative overflow-hidden group bg-slate-950/40 backdrop-blur-xl border border-indigo-500/10 hover:border-indigo-500/40 rounded-[2rem] p-6 flex flex-col text-left transition-all duration-500 hover:shadow-[0_0_30px_rgba(99,102,241,0.1)] flex-1 min-h-0"
                            >
                                {/* Premium Tooltip */}
                                <div className="absolute top-6 right-6 z-30 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-1 group-hover:translate-y-0 pointer-events-none">
                                    <div className="bg-slate-900/95 shadow-2xl border border-white/10 rounded-xl p-3 max-w-[200px] backdrop-blur-xl">
                                        <p className="text-[10px] font-bold text-slate-300 leading-relaxed uppercase tracking-tighter mb-1 border-b border-white/5 pb-1">Inzicht</p>
                                        <p className="text-[9px] font-medium text-slate-400 leading-relaxed">
                                            Start een gepersonaliseerde sessie die zich focust op de onderwerpen waar je momenteel het laagst op scoort.
                                        </p>
                                    </div>
                                </div>

                                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-[50px] group-hover:bg-indigo-500/15 transition-all duration-700" />

                                <div className="flex items-center gap-2 mb-2">
                                    <div className="p-1.5 rounded-lg bg-white/5 text-white group-hover:bg-indigo-500 group-hover:text-white transition-all duration-500">
                                        <Zap size={14} />
                                    </div>
                                    <span className="text-indigo-400 text-[9px] font-black uppercase tracking-[0.2em]">AI Coach</span>
                                </div>

                                <div className="space-y-1 mb-auto">
                                    <h3 className="text-xl font-black text-white leading-tight group-hover:translate-x-1 transition-transform duration-500">
                                        Smart Workout
                                    </h3>
                                    <p className="text-slate-500 text-[10px] font-medium leading-relaxed max-w-[90%]">
                                        Optimaliseer je vooruitgang via je <span className="text-indigo-400">zwakke domeinen</span>.
                                    </p>
                                </div>

                                <div className="mt-4 flex items-center justify-between">
                                    <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
                                        Start Sessie
                                    </span>
                                    <div className="p-1 text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all duration-500">
                                        <ChevronRight size={18} />
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Expanded Trajectory Trend (2/3 width) */}
                    <div className="lg:col-span-8">
                        <TrajectoryCard data={trajectoryData} />
                    </div>
                </div>

                {/* Layout Grid Tier 2: Strategic Hub (2x2 Primary Diagnostics) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column: Insight -> Tactical Diagnosis */}
                    <div className="flex flex-col gap-6">
                        <RTTICard data={rttiData} />
                        <ErrorDNACard data={errorData} />
                    </div>

                    {/* Right Column: Metacognition -> Strategic Targets */}
                    <div className="flex flex-col gap-6">
                        <ConfidenceMatrixCard data={confidenceData} />
                        <PointsToGainCard data={pointsData} />
                    </div>
                </div>

                {/* Layout Grid Tier 3: Core Analytical Diagnostics */}
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <RetentionCard data={retentionData} />
                        <BenchmarkCard data={benchmarkData} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FocusWellnessCard
                            mental={mentalState}
                            volume={mentalState.volume24h}
                            wpm={wpmData}
                        />
                        <TimeAnalysisCard data={timeData} />
                        <StaminaTrackerCard data={staminaData} />
                    </div>

                    <SyllabusCard data={syllabusData} />
                </div>

                {/* Section 3: Skill Heatmap with Elevated Design */}
                <KnowledgeMap levelMap={levelMap} />
            </div>
        </AnalyticsUIContext.Provider>
    );
};
