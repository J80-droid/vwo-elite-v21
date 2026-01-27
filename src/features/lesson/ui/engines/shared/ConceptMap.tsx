import { InteractiveComponentSchema } from "@shared/types/lesson.schema";
import React, { useCallback, useState } from "react";
import ReactFlow, {
    addEdge,
    applyEdgeChanges,
    applyNodeChanges,
    Background,
    Connection,
    Controls,
    Edge,
    EdgeChange,
    Node,
    NodeChange
} from "reactflow";
import { z } from "zod";

type InteractiveComponent = z.infer<typeof InteractiveComponentSchema>;
type ComponentConfig<T extends InteractiveComponent['type']> = Extract<InteractiveComponent, { type: T }>['config'];

export const ConceptMap: React.FC<{
    config: ComponentConfig<"concept-map">;
    onUpdate?: (c: ComponentConfig<"concept-map">) => void;
    mastery?: 'novice' | 'competent' | 'expert';
}> = ({ config, onUpdate, mastery }) => {
    const isNovice = mastery === 'novice';
    const initialNodes = React.useMemo(() => config.nodes.map((n, i) => {
        const node = n as Record<string, unknown>;
        return {
            id: n.id,
            type: 'default',
            position: {
                x: (node.x as number) ?? (50 + (i * 150) % 600),
                y: (node.y as number) ?? (50 + Math.floor(i / 4) * 100)
            },
            data: { label: n.label },
            style: {
                background: '#1e293b',
                color: '#fff',
                border: '1px solid #3b82f6',
                borderRadius: '8px',
                padding: '10px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }
        };
    }), [config.nodes]); // Removed unnecessary isNovice dependency

    const initialEdges = React.useMemo(() => config.edges.map((e, i) => ({
        id: `e-${i}`,
        source: e.source,
        target: e.target,
        label: e.label,
        animated: true,
        style: { stroke: '#fbbf24' }
    })), [config.edges]);

    const [nodes, setNodes] = useState<Node[]>(initialNodes);
    const [edges, setEdges] = useState<Edge[]>(initialEdges);

    const onNodesChange = useCallback((changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
    const onEdgesChange = useCallback((changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);
    const onConnect = useCallback((connection: Connection) => setEdges((eds) => addEdge(connection, eds)), [setEdges]);

    // ELITE FIX: Preventing Infinite Loop
    // Synchronize local state with props only when content actually changes.
    // Using length and first node label as heuristic for stability.
    const nodesRefKey = `${config.nodes.length}-${config.nodes[0]?.label || ''}`;
    const edgesRefKey = `${config.edges.length}`;

    React.useEffect(() => {
        setNodes(initialNodes);
        setEdges(initialEdges);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [nodesRefKey, edgesRefKey]);

    const handleNodeDragStop = () => {
        if (!onUpdate) return;
        const newNodes = nodes.map(n => ({
            id: n.id,
            label: (n.data as Record<string, unknown>).label as string,
            x: n.position.x,
            y: n.position.y
        }));
        const newEdges = edges.map(e => ({ source: e.source, target: e.target, label: e.label as string }));
        onUpdate({ ...config, nodes: newNodes, edges: newEdges });
    };

    return (
        <div className="bg-white/5 border border-white/10 rounded-xl h-[400px] relative overflow-hidden">
            <div className="absolute top-2 left-2 z-10 text-xs text-slate-400 font-mono pointer-events-none flex items-center gap-2">
                React Flow Interactive {isNovice && <span className="bg-blue-500/20 text-blue-400 px-1 rounded text-[10px]">BASIC VIEW</span>}
            </div>
            <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onNodeDragStop={handleNodeDragStop} fitView>
                <Background color="#aaa" gap={16} />
                <Controls className="bg-white/10 border-white/20 text-white" />
            </ReactFlow>
        </div>
    );
};
