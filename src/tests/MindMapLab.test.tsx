import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// import React from 'react';
import { MindMapStage as MindMapLab } from "../features/brainstorm/ui/modules/mindmap/MindMapStage";

// Mock React Flow
vi.mock("reactflow", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div>ReactFlow {children}</div>
  ),
  Background: () => <div>Background</div>,
  Controls: () => <div>Controls</div>,
  MiniMap: () => <div>MiniMap</div>,
  useNodesState: (initial: unknown) => [initial, vi.fn(), vi.fn()],
  useEdgesState: (initial: unknown) => [initial, vi.fn(), vi.fn()],
  addEdge: vi.fn(),
  MarkerType: { ArrowClosed: "arrowclosed" },
}));

// Mock Dagre
vi.mock("dagre", () => ({
  default: {
    graphlib: {
      Graph: class {
        setDefaultEdgeLabel() {}
        setGraph() {}
        setNode() {}
        setEdge() {}
        node() {
          return { x: 0, y: 0 };
        }
      },
    },
    layout: vi.fn(),
  },
}));

// Mock Gemini
vi.mock("../services/gemini", () => ({
  generateMindMap: vi.fn().mockResolvedValue({
    nodes: [{ id: "1", label: "Root" }],
    edges: [],
  }),
}));

describe("MindMapLab Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render initial UI", () => {
    render(<MindMapLab />);
    expect(screen.getByText("MindMap Lab")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Onderwerp/i)).toBeInTheDocument();
    expect(screen.getByText("Genereer MindMap")).toBeInTheDocument();
  });

  it("should handle generating a mindmap", async () => {
    render(<MindMapLab />);

    const input = screen.getByPlaceholderText(/Onderwerp/i);
    fireEvent.change(input, { target: { value: "Biology" } });

    const btn = screen.getByText("Genereer MindMap");
    fireEvent.click(btn);

    // Expectation depends on how we mocked useNodesState...
    // Since we mocked useNodesState to return initial, state updates won't trigger re-renders in this shallow test unless we use a better mock.
    // But we can check if the button goes directly to 'Genereer MindMap' or 'Genereren...' depending on async.
    // Ideally we mock useNodesState to actually work or just check call args.

    await waitFor(async () => {
      // Check if call was made
      const { generateMindMap } = await import("@shared/api/gemini");
      expect(generateMindMap).toHaveBeenCalled();
    });
  });
});
