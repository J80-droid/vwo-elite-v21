/* eslint-disable @typescript-eslint/no-explicit-any */
import "reactflow/dist/style.css";

import { generateMindMap } from "@shared/api/gemini";
import { useTranslations } from "@shared/hooks/useTranslations";
import { useMindMapStore } from "@shared/model/mindMapStore";
import dagre from "dagre";
import html2canvas from "html2canvas";
import { Brain, Download, Eye, EyeOff, Layout, Save } from "lucide-react";
import React, { useCallback, useRef, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  Edge,
  MarkerType,
  MiniMap,
  Node,
  Position,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "reactflow";

import { MindMapSidebar } from "./MindMapSidebar";

const nodeWidth = 180;
const nodeHeight = 50;

// Layout Engine
const getLayoutedElements = (
  nodes: Node[],
  edges: Edge[],
  direction = "LR",
) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  return {
    nodes: nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      return {
        ...node,
        targetPosition: direction === "LR" ? Position.Left : Position.Top,
        sourcePosition: direction === "LR" ? Position.Right : Position.Bottom,
        position: {
          x: nodeWithPosition.x - nodeWidth / 2,
          y: nodeWithPosition.y - nodeHeight / 2,
        },
      };
    }),
    edges,
  };
};

const MindMapInner: React.FC = () => {
  const { lang } = useTranslations();
  const { saveMap, savedMaps, deleteMap } = useMindMapStore();
  const { fitView } = useReactFlow();
  const flowWrapper = useRef<HTMLDivElement>(null);

  // React Flow State
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // App State
  const [topic, setTopic] = useState("");
  const [context, setContext] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [blindMode, setBlindMode] = useState(false);

  // --- ACTIONS ---

  const handleGenerate = async () => {
    if (!topic) return;
    setIsGenerating(true);
    setSelectedNode(null);
    try {
      const data = await generateMindMap(topic, context, lang);

      const initialNodes: Node[] = data.nodes.map((n: any) => ({
        id: n.id,
        type: "default",
        data: { label: n.label, details: n.details },
        position: { x: 0, y: 0 },
        style: {
          background: "#1e293b",
          color: "#fff",
          border: "1px solid #3b82f6",
          width: nodeWidth,
          fontSize: "12px",
          borderRadius: "8px",
          cursor: "pointer",
        },
      }));

      const initialEdges: Edge[] = data.edges.map((e: any) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed, color: "#64748b" },
        style: { stroke: "#64748b" },
      }));

      const layouted = getLayoutedElements(initialNodes, initialEdges, "LR");
      setNodes(layouted.nodes);
      setEdges(layouted.edges);
      setTimeout(() => fitView(), 100);
    } catch (error) {
      console.error(error);
      alert("Fout bij genereren.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExpandNode = async () => {
    if (!selectedNode || isGenerating) return;
    setIsGenerating(true);
    try {
      const data = await generateMindMap(
        selectedNode.label,
        `Expand on the subtopic: ${selectedNode.label}. Related to the main topic: ${topic}`,
        lang,
      );

      const newNodes: Node[] = data.nodes.map((n: any) => ({
        id: `expanded-${n.id}-${Date.now()}`,
        type: "default",
        data: { label: n.label, details: n.details },
        position: {
          x: selectedNode.position?.x || 0,
          y: selectedNode.position?.y || 0,
        },
        style: {
          background: "#0f172a",
          color: "#fff",
          border: "1px solid #10b981",
          width: nodeWidth,
          fontSize: "11px",
          borderRadius: "8px",
          cursor: "pointer",
        },
      }));

      const parentNodeId = nodes.find(
        (n) => n.data.label === selectedNode.label,
      )?.id;

      const newEdges: Edge[] = data.edges.map((e: any) => ({
        id: `expanded-edge-${e.id}-${Date.now()}`,
        source:
          e.source === "root"
            ? parentNodeId || "root"
            : `expanded-${e.source}-${Date.now()}`,
        target: `expanded-${e.target}-${Date.now()}`,
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed, color: "#10b981" },
        style: { stroke: "#10b981", strokeDasharray: "5,5" },
      }));

      const combinedNodes = [...nodes, ...newNodes];
      const combinedEdges = [...edges, ...newEdges];

      const layouted = getLayoutedElements(combinedNodes, combinedEdges, "LR");
      setNodes(layouted.nodes);
      setEdges(layouted.edges);
      setTimeout(() => fitView(), 200);
    } catch (error) {
      console.error(error);
      alert("Fout bij uitbreiden van takken.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (nodes.length === 0) return;
    saveMap(topic || "Naamloos", nodes, edges);
  };

  const loadMap = (map: any) => {
    setNodes(map.nodes);
    setEdges(map.edges);
    setTopic(map.topic);
    setTimeout(() => fitView(), 100);
  };

  const handleExport = () => {
    if (flowWrapper.current) {
      html2canvas(flowWrapper.current).then((canvas) => {
        const link = document.createElement("a");
        link.download = `mindmap-${topic || "export"}.png`;
        link.href = canvas.toDataURL();
        link.click();
      });
    }
  };

  const toggleLayout = () => {
    const layouted = getLayoutedElements(nodes, edges, "TB");
    setNodes([...layouted.nodes]);
    setEdges([...layouted.edges]);
    setTimeout(() => fitView(), 200);
  };

  const getProcessedNodes = () => {
    if (!blindMode) return nodes;
    return nodes.map((node) => {
      const isRoot = node.position.x < 100;
      return {
        ...node,
        style: {
          ...node.style,
          filter: isRoot ? "none" : "blur(6px)",
          transition: "filter 0.3s ease",
        },
      };
    });
  };

  const handleNodeClick = useCallback((_e: any, node: Node) => {
    setSelectedNode(node.data);
  }, []);

  return (
    <div className="flex w-full h-full">
      {/* Sidebar (Integrated) */}
      <div className="w-80 shrink-0 border-r border-white/10 z-20">
        <MindMapSidebar
          topic={topic}
          setTopic={setTopic}
          context={context}
          setContext={setContext}
          handleGenerate={handleGenerate}
          isGenerating={isGenerating}
          selectedNode={selectedNode}
          setSelectedNode={setSelectedNode}
          handleExpandNode={handleExpandNode}
          savedMaps={savedMaps}
          loadMap={loadMap}
          deleteMap={deleteMap}
        />
      </div>

      {/* Stage */}
      <div className="flex-1 relative h-full bg-obsidian-950" ref={flowWrapper}>
        {/* Toolbar Overlay */}
        <div className="absolute top-4 right-4 z-40 flex items-center gap-2 bg-black/50 p-1.5 rounded-lg border border-white/10 backdrop-blur">
          <button
            onClick={handleSave}
            className="p-2 hover:bg-white/10 rounded-lg text-slate-300 transition"
            title="Opslaan"
          >
            <Save size={18} />
          </button>
          <div className="h-4 w-px bg-white/10"></div>
          <button
            onClick={() => setBlindMode(!blindMode)}
            className={`p-2 rounded-lg transition-all ${blindMode ? "text-amber-400 bg-amber-500/10" : "text-slate-300 hover:bg-white/10"}`}
            title="Toets Modus (Blind)"
          >
            {blindMode ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
          <button
            onClick={toggleLayout}
            className="p-2 hover:bg-white/10 rounded-lg text-slate-300 transition"
            title="Wissel Layout"
          >
            <Layout size={18} />
          </button>
          <button
            onClick={handleExport}
            className="p-2 hover:bg-white/10 rounded-lg text-slate-300 transition"
            title="Export PNG"
          >
            <Download size={18} />
          </button>
        </div>

        <ReactFlow
          nodes={getProcessedNodes()}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          fitView
          className="bg-obsidian-950"
          minZoom={0.1}
        >
          <Background color="#334155" gap={24} size={1} />
          <Controls className="bg-white/10 border-white/20 text-white fill-white" />
          <MiniMap
            nodeColor="#3b82f6"
            maskColor="rgba(0,0,0,0.6)"
            className="bg-obsidian-900 border border-white/10 rounded-lg !bottom-4 !right-4"
          />

          {nodes.length === 0 && !isGenerating && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center opacity-20">
                <Brain size={80} className="mx-auto mb-4" />
                <p className="text-2xl font-bold">MindMap Lab</p>
                <p>Begin met een onderwerp links.</p>
              </div>
            </div>
          )}
        </ReactFlow>
      </div>
    </div>
  );
};

export const MindMapStage: React.FC = () => (
  <ReactFlowProvider>
    <MindMapInner />
  </ReactFlowProvider>
);
