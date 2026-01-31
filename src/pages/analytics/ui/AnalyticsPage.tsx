import {
  AlertTriangle,
  ArrowLeft,
  Dumbbell,
  GraduationCap,
  Mic,
} from "lucide-react";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { EliteGymAnalytics } from "@features/analytics/ui/EliteGymAnalytics";
import { BlurtingAnalytics } from "./components/BlurtingAnalytics";
import { ExamAnalytics } from "./components/ExamAnalytics";
import { LiveSessionInterface } from "./components/LiveSessionInterface";
import { WeakPointsDashboard } from "./components/WeakPointsDashboard";

const AnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  // const { t } = useTranslations();
  const [activeTab, setActiveTab] = useState<
    "weakpoints" | "live" | "mastery" | "gyms" | "exams" | "blurting"
  >("exams");

  return (
    <div className="min-h-screen bg-black p-6 md:p-12 text-white pb-32">
      <button
        onClick={() => navigate("/")}
        className="group flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors"
      >
        <div className="p-2 rounded-lg bg-white/5 border border-white/10 group-hover:bg-white/10 group-hover:border-white/20 transition-all">
          <ArrowLeft size={20} />
        </div>
        <span className="font-bold text-sm uppercase tracking-wider">
          Dashboard
        </span>
      </button>

      <header className="mb-8">
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 uppercase tracking-tighter mb-2">
          Ultimate Analytics
        </h1>
        <p className="text-slate-400">
          Elite Performance Tracking & Live Coaching
        </p>
      </header>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 bg-white/5 p-1 rounded-xl w-fit border border-white/10">
        <button
          onClick={() => setActiveTab("exams")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all border ${activeTab === "exams"
            ? "bg-blue-500/10 text-blue-400 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.2)]"
            : "text-slate-400 border-transparent hover:text-white hover:bg-white/5"
            }`}
        >
          <GraduationCap size={16} />
          Exams
        </button>
        <button
          onClick={() => setActiveTab("gyms")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all border ${activeTab === "gyms"
            ? "bg-rose-500/10 text-rose-400 border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.2)]"
            : "text-slate-400 border-transparent hover:text-white hover:bg-white/5"
            }`}
        >
          <Dumbbell size={16} />
          Gyms
        </button>
        <button
          onClick={() => setActiveTab("weakpoints")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all border ${activeTab === "weakpoints"
            ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.2)]"
            : "text-slate-400 border-transparent hover:text-white hover:bg-white/5"
            }`}
        >
          <AlertTriangle size={16} />
          Weak Points
        </button>

        <button
          onClick={() => setActiveTab("blurting")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all border ${activeTab === "blurting"
            ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.2)]"
            : "text-slate-400 border-transparent hover:text-white hover:bg-white/5"
            }`}
        >
          <Mic size={16} />
          Active Recall
        </button>
        <button
          onClick={() => setActiveTab("live")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all border ${activeTab === "live"
            ? "bg-purple-500/10 text-purple-400 border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.2)]"
            : "text-slate-400 border-transparent hover:text-white hover:bg-white/5"
            }`}
        >
          <Mic size={16} />
          Live Coach
        </button>
      </div>

      {/* Content Area */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === "exams" && <ExamAnalytics />}

        {activeTab === "gyms" && <EliteGymAnalytics />}

        {activeTab === "weakpoints" && <WeakPointsDashboard />}

        {activeTab === "live" && <LiveSessionInterface />}

        {activeTab === "blurting" && <BlurtingAnalytics />}
      </div>
    </div>
  );
};

export default AnalyticsPage;
