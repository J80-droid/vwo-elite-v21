// import { useTranslations } from "@shared/hooks/useTranslations";
import { Mic, MicOff, PhoneOff, VideoOff } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

export const LiveSessionInterface: React.FC = () => {
  // const { t } = useTranslations();
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [status, setStatus] = useState<
    "connecting" | "listening" | "speaking" | "thinking"
  >("connecting");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Simulated Audio Waveform
  useEffect(() => {
    if (!isActive || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);
      ctx.lineWidth = 2;
      ctx.strokeStyle = status === "speaking" ? "#34d399" : "#a855f7"; // Emerald (AI speaking) or Purple (Listening)

      ctx.beginPath();

      const amplitude = status === "speaking" ? 50 : 20;
      const frequency = status === "speaking" ? 0.05 : 0.02;

      for (let x = 0; x < width; x++) {
        const y =
          height / 2 +
          Math.sin(x * frequency + time) *
            amplitude *
            Math.sin((x / width) * Math.PI) +
          Math.random() * 5; // Add some jitter/noise
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.stroke();
      time += 0.2;
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    // Simulate status changes
    const statusInterval = setInterval(() => {
      const states: ("listening" | "speaking" | "thinking")[] = [
        "listening",
        "thinking",
        "speaking",
      ];
      const nextState = states[Math.floor(Math.random() * states.length)];
      if (nextState) setStatus(nextState);
    }, 3000);

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearInterval(statusInterval);
    };
  }, [isActive, status]);

  if (!isActive) {
    return (
      <div className="h-[500px] flex flex-col items-center justify-center bg-obsidian-900/50 border border-white/10 rounded-2xl p-6">
        <div className="w-24 h-24 rounded-full bg-purple-500/10 flex items-center justify-center mb-6 animate-pulse">
          <Mic className="text-purple-400" size={40} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Live AI Coach</h2>
        <p className="text-slate-400 text-center max-w-md mb-8">
          Start een voice sessie met jouw persoonlijke AI tutor. Stel vragen,
          oefen debatten of krijg uitleg over complexe onderwerpen.
        </p>
        <button
          onClick={() => {
            setIsActive(true);
            setStatus("connecting");
            setTimeout(() => setStatus("listening"), 1500);
          }}
          className="px-8 py-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/50 hover:border-indigo-500 rounded-full font-bold transition-all shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:shadow-[0_0_40px_rgba(99,102,241,0.4)] flex items-center gap-2"
        >
          <Mic size={20} />
          Start Sessie
        </button>
      </div>
    );
  }

  return (
    <div className="h-[500px] relative bg-black border border-white/10 rounded-2xl overflow-hidden flex flex-col">
      {/* Header / Status */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full animate-pulse ${
              status === "connecting"
                ? "bg-amber-500"
                : status === "listening"
                  ? "bg-purple-500"
                  : status === "speaking"
                    ? "bg-emerald-500"
                    : "bg-blue-500"
            }`}
          />
          <span className="text-sm font-bold text-white uppercase tracking-wider">
            {status === "connecting"
              ? "Verbinden..."
              : status === "listening"
                ? "Luisteren..."
                : status === "speaking"
                  ? "AI Spreekt"
                  : "Denken..."}
          </span>
        </div>
        <div className="text-xs text-slate-500 font-mono">00:14</div>
      </div>

      {/* Visualizer Area */}
      <div className="flex-1 flex items-center justify-center relative">
        {/* Avatar / Center Point */}
        <div
          className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 ${
            status === "speaking"
              ? "bg-emerald-500/20 scale-110 shadow-[0_0_50px_rgba(16,185,129,0.4)]"
              : "bg-purple-500/20 shadow-[0_0_30px_rgba(168,85,247,0.3)]"
          }`}
        >
          <div className="w-24 h-24 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center">
            {/* Placeholder for real avatar or just logo */}
            <div className="text-2xl">🤖</div>
          </div>
        </div>

        {/* Waveform Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-x-0 bottom-20 h-32 w-full opacity-50 pointer-events-none"
          width={800}
          height={150}
        />
      </div>

      {/* Controls */}
      <div className="p-6 flex justify-center gap-4 bg-gradient-to-t from-black via-black/90 to-transparent">
        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`p-4 rounded-full transition-all border ${
            isMuted
              ? "bg-red-500/10 text-red-400 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)] hover:shadow-[0_0_30px_rgba(239,68,68,0.3)]"
              : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20"
          }`}
        >
          {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>
        <button className="p-4 rounded-full bg-white/10 text-white hover:bg-white/20 border border-white/10 opacity-50 cursor-not-allowed">
          <VideoOff size={24} />
        </button>
        <button
          onClick={() => setIsActive(false)}
          className="p-4 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 hover:border-red-500 transition-all shadow-[0_0_20px_rgba(239,68,68,0.2)] hover:shadow-[0_0_40px_rgba(239,68,68,0.4)]"
        >
          <PhoneOff size={24} />
        </button>
      </div>
    </div>
  );
};
