/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
// Pas import aan naar jouw store
import { useLessonProgressStore } from "@shared/model/lessonProgressStore";
import { Filter, Maximize2, Search, Share2, X } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { useParams } from "react-router-dom";

interface KnowledgeStageProps {
  isOpen?: boolean;
  onClose?: () => void;
  highlightNodeId?: string; // De prop die we vanuit LessonGenerator doorgeven
}

export const KnowledgeStage: React.FC<KnowledgeStageProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
  highlightNodeId: propHighlightNodeId,
}) => {
  // Determine context (Modal vs Standalone)
  // If props are provided, it's likely a modal. If not, it might be the route page.
  // Ideally, we handle this more explicitly, but for now we follow the improved Modal pattern.

  // Check if we are in routed mode (standalone)
  const { subject: routeSubject } = useParams<{ subject: string }>();

  const isModal = typeof propIsOpen === "boolean";
  const isOpen = isModal ? propIsOpen : true; // Always open if standalone
  const onClose = propOnClose || (() => {});
  const highlightNodeId = propHighlightNodeId;

  const fgRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Custom resize observer logic
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        setDimensions({ width, height });
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const { width, height } = dimensions;

  const { getGraphData } = useLessonProgressStore();
  const graphData = useMemo(
    () => getGraphData(routeSubject),
    [getGraphData, routeSubject, isOpen],
  );

  // Lokale state voor interactie
  const [searchText, setSearchText] = useState("");

  // 1. AUTO-FOCUS LOGICA
  useEffect(() => {
    if (
      isOpen &&
      highlightNodeId &&
      fgRef.current &&
      graphData.nodes.length > 0
    ) {
      const node = graphData.nodes.find((n: any) => n.id === highlightNodeId);

      if (node) {
        setTimeout(() => {
          fgRef.current.centerAt((node as any).x, (node as any).y, 1000); // 1000ms animatie
          fgRef.current.zoom(2.5, 1000);
        }, 250);
      }
    }
  }, [isOpen, highlightNodeId, graphData]);

  // Sluit met ESC toets (alleen modal)
  useEffect(() => {
    if (!isModal) return;
    const handleEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose, isModal]);

  if (!isOpen) return null;

  const Content = (
    <div className="relative w-full h-full bg-obsidian-950 flex flex-col overflow-hidden rounded-2xl">
      {/* HEADER */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-obsidian-900 z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-electric">
            <Share2 size={20} />
            <h2 className="font-bold text-white">Kennisnetwerk</h2>
          </div>

          {/* Search Bar inside Modal */}
          <div className="relative group hidden sm:block">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-electric"
              size={14}
            />
            <input
              type="text"
              placeholder="Zoek concept..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="bg-black/40 border border-white/10 rounded-full pl-9 pr-4 py-1.5 text-sm text-white focus:border-electric focus:outline-none w-64 transition-all"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button className="p-2 hover:bg-white/10 rounded-lg text-slate-400 transition">
            <Filter size={20} />
          </button>
          <button className="p-2 hover:bg-white/10 rounded-lg text-slate-400 transition">
            <Maximize2 size={20} />
          </button>
          {isModal && onClose && (
            <>
              <div className="w-px bg-white/10 mx-2"></div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-rose-500/20 hover:text-rose-400 rounded-lg text-slate-400 transition"
              >
                <X size={20} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* GRAPH AREA */}
      <div
        ref={containerRef}
        className="flex-1 relative bg-radial-gradient from-obsidian-800 to-obsidian-950 overflow-hidden"
      >
        {/* Render graph only when dimensions are known to prevent layout shifts */}
        {width && height && (
          <ForceGraph2D
            ref={fgRef}
            width={width}
            height={height}
            graphData={graphData}
            // Visual Styling
            nodeLabel="name"
            nodeColor={(node: any) =>
              node.id === highlightNodeId
                ? "#00f0ff"
                : node.group === "core"
                  ? "#ffd700"
                  : "#64748b"
            }
            nodeRelSize={6}
            linkColor={() => "rgba(255,255,255,0.1)"}
            // Particles (Obsidian Look)
            linkDirectionalParticles={2}
            linkDirectionalParticleSpeed={0.005}
            linkDirectionalParticleWidth={2}
            // Interaction
            onNodeClick={(node) => {
              fgRef.current.centerAt(node.x, node.y, 800);
              fgRef.current.zoom(3, 800);
            }}
            backgroundColor="rgba(0,0,0,0)"
          />
        )}

        {/* Legend Overlay */}
        <div className="absolute bottom-6 left-6 bg-black/60 backdrop-blur-md p-4 rounded-xl border border-white/5 text-xs text-slate-400 space-y-2 pointer-events-none">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gold"></span> Kernconcepten
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-electric"></span>{" "}
            Geselecteerd
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-slate-500"></span>{" "}
            Gerelateerd
          </div>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="relative w-full h-full max-w-[95vw] max-h-[90vh] shadow-3xl flex flex-col">
          {Content}
        </div>
      </div>
    );
  }

  return <div className="h-full w-full">{Content}</div>;
};
