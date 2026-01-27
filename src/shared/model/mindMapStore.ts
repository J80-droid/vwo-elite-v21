import { createStore } from "@shared/lib/storeFactory";
import { Edge, Node } from "reactflow";

export interface SavedMap {
  id: string;
  topic: string;
  nodes: Node[];
  edges: Edge[];
  timestamp: number;
  lastReviewed?: number;
}

interface MindMapState {
  savedMaps: SavedMap[];

  // Actions
  saveMap: (topic: string, nodes: Node[], edges: Edge[]) => void;
  deleteMap: (id: string) => void;
  loadMap: (id: string) => SavedMap | undefined;
  updateMap: (id: string, nodes: Node[], edges: Edge[]) => void;
}

export const useMindMapStore = createStore<MindMapState>(
  (set, get) => ({
    savedMaps: [],

    saveMap: (topic, nodes, edges) => {
      set((state) => ({
        savedMaps: [
          {
            id: crypto.randomUUID(),
            topic,
            nodes,
            edges,
            timestamp: Date.now(),
          },
          ...state.savedMaps,
        ],
      }));
    },

    updateMap: (id, nodes, edges) => {
      set((state) => ({
        savedMaps: state.savedMaps.map((map) =>
          map.id === id
            ? { ...map, nodes, edges, lastReviewed: Date.now() }
            : map,
        ),
      }));
    },

    deleteMap: (id) => {
      set((state) => ({
        savedMaps: state.savedMaps.filter((m) => m.id !== id),
      }));
    },

    loadMap: (id) => get().savedMaps.find((m) => m.id === id),
  }),
  { name: "mindmap" }
);
