import { useCallback, useEffect, useRef } from "react";

import { useModuleState } from "../../../hooks/usePhysicsLabContext";

export type ComponentType =
  | "wire"
  | "resistor"
  | "battery"
  | "bulb"
  | "switch"
  | "capacitor"
  | "inductor"
  | "ac_source"
  | "ldr"
  | "ntc"
  | "ground";

export interface CircuitComponent {
  id: string;
  type: ComponentType;
  pos: [number, number, number];
  rotation?: number;
  nodes: [string, string];
  value: number;
  frequency?: number;
  isOpen?: boolean;
  current?: number;
  voltageDrop?: number;
  power?: number;
  externalFactor?: number;
  pinOffset?: number;
}

export interface CircuitState {
  components: CircuitComponent[];
  nodes: Record<string, { voltage: number; base?: boolean }>;
  isPlaying: boolean;
  isTripped: boolean; // NIEUW: Zekering status
  error: string | null; // NIEUW: Foutmelding
  showElectrons: boolean;
  totalPower: number;
  totalCurrent: number;
  selectedId: string | null;
  nodeVoltages: number[];
  time: number;
}

export const DEFAULT_STATE: CircuitState = {
  components: [],
  nodes: { ground: { voltage: 0, base: true } },
  isPlaying: true,
  isTripped: false,
  error: null,
  showElectrons: true,
  totalPower: 0,
  totalCurrent: 0,
  selectedId: null,
  nodeVoltages: [],
  time: 0,
};

// GLOBAL REUSABLE BUFFERS
const MAX_NODES = 64;
const BUFFER_A = new Float64Array(MAX_NODES * MAX_NODES);
const BUFFER_Z = new Float64Array(MAX_NODES);
const BUFFER_X = new Float64Array(MAX_NODES);

// Instellingen voor de zekering
const TRIP_CURRENT_THRESHOLD = 20.0; // Maximaal 20 Ampère voor beveiliging ingrijpt

export const useCircuitsEngine = () => {
  const [rawState, setModuleState] = useModuleState<CircuitState>("circuits");
  const state = { ...DEFAULT_STATE, ...rawState };

  const historyRef = useRef<{ t: number; V: number; I: number }[]>([]);
  const stateVariablesRef = useRef<Record<string, number>>({});
  const latestVoltagesRef = useRef<Record<string, number>>({});
  interface TopologyCache {
    signature: string;
    pinToNode: number[];
    nodeCount: number;
    compToNodes: [number, number][];
    vSourceIndices: number[];
  }
  const topologyCacheRef = useRef<TopologyCache>({
    signature: "",
    pinToNode: [],
    nodeCount: 0,
    compToNodes: [],
    vSourceIndices: [],
  });

  const solveCircuit = useCallback(
    (components: CircuitComponent[], time: number) => {
      if (!components || components.length === 0) {
        return {
          nodes: { ground: { voltage: 0 } },
          components: [],
          totalPower: 0,
          totalCurrent: 0,
          nodeVoltages: [],
          tripped: false, // Return status
        };
      }

      // 1. Topology Check & Cache
      const currentSignature =
        components.length +
        ":" +
        components
          .map(
            (c) =>
              c.id +
              Math.round(c.pos[0] * 2) / 2 +
              Math.round(c.pos[2] * 2) / 2 +
              c.isOpen +
              c.rotation,
          )
          .join("");

      let pinToNode: number[] = [];
      let nodeCount = 0;
      let compToNodes: [number, number][] = [];
      let vSourceIndices: number[] = [];
      let vSources: CircuitComponent[] = [];

      if (topologyCacheRef.current.signature === currentSignature) {
        ({ pinToNode, nodeCount, compToNodes, vSourceIndices } =
          topologyCacheRef.current);
        vSources = vSourceIndices
          .map((i) => components[i])
          .filter((c): c is CircuitComponent => !!c);
      } else {
        const SNAP_THRESHOLD = 0.4;
        const pins: {
          pos: [number, number, number];
          compIdx: number;
          pinIdx: number;
        }[] = [];

        components.forEach((c, i) => {
          const rot = c.rotation || 0;
          const offset = c.pinOffset ?? 0.5;
          const dx = Math.cos(rot) * offset;
          const dz = Math.sin(rot) * offset;
          pins.push({
            pos: [c.pos[0] - dx, c.pos[1], c.pos[2] - dz],
            compIdx: i,
            pinIdx: 0,
          });
          pins.push({
            pos: [c.pos[0] + dx, c.pos[1], c.pos[2] + dz],
            compIdx: i,
            pinIdx: 1,
          });
        });

        pinToNode = new Array(pins.length).fill(-1);
        nodeCount = 0;
        for (let i = 0; i < pins.length; i++) {
          if (pinToNode[i] !== -1) continue;
          const currentNode = nodeCount++;
          pinToNode[i] = currentNode;
          const queue = [i];
          while (queue.length > 0) {
            const currentIdx = queue.shift()!;
            if (!pins[currentIdx]) continue;
            const p1 = pins[currentIdx];
            for (let j = 0; j < pins.length; j++) {
              if (pinToNode[j] !== -1) continue;
              const p2 = pins[j];
              if (!p2) continue;
              const distSq =
                (p1.pos[0] - p2.pos[0]) ** 2 +
                (p1.pos[1] - p2.pos[1]) ** 2 +
                (p1.pos[2] - p2.pos[2]) ** 2;
              if (distSq < SNAP_THRESHOLD * SNAP_THRESHOLD) {
                pinToNode[j] = currentNode;
                queue.push(j);
              }
            }
          }
        }

        // SMART REFERENCE LOGIC
        let idealRefNode = -1;
        const groundCompIdx = components.findIndex((c) => c.type === "ground");
        if (groundCompIdx !== -1) {
          idealRefNode = pinToNode[groundCompIdx * 2] || 0;
        } else {
          const vSourceEx = components.find(
            (c) => c.type === "battery" || c.type === "ac_source",
          );
          if (vSourceEx) {
            const idx = components.indexOf(vSourceEx);
            idealRefNode = pinToNode[idx * 2] || 0;
          }
        }

        if (idealRefNode > 0) {
          for (let k = 0; k < pinToNode.length; k++) {
            if (pinToNode[k] === 0) pinToNode[k] = idealRefNode;
            else if (pinToNode[k] === idealRefNode) pinToNode[k] = 0;
          }
        }

        compToNodes = components.map((_, i) => [
          pinToNode[i * 2] || 0,
          pinToNode[i * 2 + 1] || 0,
        ]);
        vSourceIndices = components
          .map((c, i) =>
            c.type === "battery" || c.type === "ac_source" ? i : -1,
          )
          .filter((i) => i !== -1);
        vSources = vSourceIndices
          .map((i) => components[i])
          .filter((c): c is CircuitComponent => !!c);

        topologyCacheRef.current = {
          signature: currentSignature,
          pinToNode,
          nodeCount,
          compToNodes,
          vSourceIndices,
        };
      }

      const numV = vSources.length;
      const matrixSize = nodeCount + numV;

      if (matrixSize > MAX_NODES) {
        return {
          nodes: state.nodes,
          components,
          totalPower: 0,
          totalCurrent: 0,
          nodeVoltages: state.nodeVoltages,
          tripped: false,
        };
      }

      // 2. Matrix Reset
      BUFFER_Z.fill(0, 0, matrixSize);
      BUFFER_A.fill(0, 0, matrixSize * matrixSize);

      const dt = 0.001;

      // 3. Stamp MNA Matrix
      components.forEach((c, i) => {
        const mapping = compToNodes[i];
        if (!mapping) return;
        const [n1, n2] = mapping;
        const n1n1 = n1 * MAX_NODES + n1;
        const n2n2 = n2 * MAX_NODES + n2;
        const n1n2 = n1 * MAX_NODES + n2;
        const n2n1 = n2 * MAX_NODES + n1;

        if (
          c.type === "resistor" ||
          c.type === "bulb" ||
          c.type === "wire" ||
          c.type === "ldr" ||
          c.type === "ntc"
        ) {
          let r = c.type === "wire" ? 1e-6 : c.value || 0.01;
          if (c.type === "ldr")
            r = (c.value || 1000) / (0.1 + (c.externalFactor || 0.5) * 10);
          if (c.type === "ntc")
            r =
              (c.value || 1000) *
              Math.exp(-4 * ((c.externalFactor || 0.5) - 0.5));
          r = Math.max(1e-6, r);
          const g = 1 / r;
          BUFFER_A[n1n1] = (BUFFER_A[n1n1] || 0) + g;
          BUFFER_A[n2n2] = (BUFFER_A[n2n2] || 0) + g;
          BUFFER_A[n1n2] = (BUFFER_A[n1n2] || 0) - g;
          BUFFER_A[n2n1] = (BUFFER_A[n2n1] || 0) - g;
        } else if (c.type === "switch") {
          const g = c.isOpen ? 1e-9 : 1e4;
          BUFFER_A[n1n1] = (BUFFER_A[n1n1] || 0) + g;
          BUFFER_A[n2n2] = (BUFFER_A[n2n2] || 0) + g;
          BUFFER_A[n1n2] = (BUFFER_A[n1n2] || 0) - g;
          BUFFER_A[n2n1] = (BUFFER_A[n2n1] || 0) - g;
        } else if (c.type === "capacitor") {
          const safeC = Math.max(1e-12, c.value || 1e-6);
          const g = safeC / dt;
          const vPrev = stateVariablesRef.current[c.id] || 0;
          const iEq = g * vPrev;
          BUFFER_A[n1n1] = (BUFFER_A[n1n1] || 0) + g;
          BUFFER_A[n2n2] = (BUFFER_A[n2n2] || 0) + g;
          BUFFER_A[n1n2] = (BUFFER_A[n1n2] || 0) - g;
          BUFFER_A[n2n1] = (BUFFER_A[n2n1] || 0) - g;
          BUFFER_Z[n1] = (BUFFER_Z[n1] || 0) + iEq;
          BUFFER_Z[n2] = (BUFFER_Z[n2] || 0) - iEq;
        } else if (c.type === "inductor") {
          const safeL = Math.max(1e-6, c.value || 1e-3);
          const g = dt / safeL;
          const iPrev = stateVariablesRef.current[c.id] || 0;
          BUFFER_A[n1n1] = (BUFFER_A[n1n1] || 0) + g;
          BUFFER_A[n2n2] = (BUFFER_A[n2n2] || 0) + g;
          BUFFER_A[n1n2] = (BUFFER_A[n1n2] || 0) - g;
          BUFFER_A[n2n1] = (BUFFER_A[n2n1] || 0) - g;
          BUFFER_Z[n1] = (BUFFER_Z[n1] || 0) - iPrev;
          BUFFER_Z[n2] = (BUFFER_Z[n2] || 0) + iPrev;
        }
      });

      vSources.forEach((v, idx) => {
        const compIdx = vSourceIndices[idx];
        const mapping = compToNodes[compIdx || 0];
        if (!mapping || compIdx === undefined) return;
        const [n1, n2] = mapping;
        const row = nodeCount + idx;
        BUFFER_A[row * MAX_NODES + n1] = 1;
        BUFFER_A[row * MAX_NODES + n2] = -1;
        BUFFER_A[n1 * MAX_NODES + row] = 1;
        BUFFER_A[n2 * MAX_NODES + row] = -1;
        if (v.type === "battery") BUFFER_Z[row] = v.value || 9;
        else
          BUFFER_Z[row] =
            (v.value || 230) *
            Math.sin(2 * Math.PI * (v.frequency || 2) * time);
      });

      for (let k = 0; k < matrixSize; k++) BUFFER_A[0 * MAX_NODES + k] = 0;
      BUFFER_A[0] = 1;
      BUFFER_Z[0] = 0;
      const Gmin = 1e-10;
      for (let i = 0; i < nodeCount; i++) BUFFER_A[i * MAX_NODES + i]! += Gmin;

      solveGaussianFlat(BUFFER_A, BUFFER_Z, BUFFER_X, matrixSize);

      let totalP = 0;
      let totalI = 0;
      let maxSingleComponentCurrent = 0;
      const result = BUFFER_X;

      if (!Number.isFinite(result[0]) || Number.isNaN(result[0])) {
        result.fill(0);
      }

      const updatedComponents = components.map((c, i) => {
        const mapping = compToNodes[i];
        if (!mapping) return c;
        const [n1, n2] = mapping;
        const v1 = result[n1] || 0;
        const v2 = result[n2] || 0;
        const vDiff = v1 - v2;
        const vDrop = Math.abs(vDiff);
        let current = 0;

        if (
          c.type === "resistor" ||
          c.type === "bulb" ||
          c.type === "wire" ||
          c.type === "ldr" ||
          c.type === "ntc"
        ) {
          let r = c.type === "wire" ? 1e-6 : c.value || 0.01;
          if (c.type === "ldr")
            r = (c.value || 1000) / (0.1 + (c.externalFactor || 0.5) * 10);
          if (c.type === "ntc")
            r =
              (c.value || 1000) *
              Math.exp(-4 * ((c.externalFactor || 0.5) - 0.5));
          r = Math.max(1e-6, r); // Safe resistance for division
          current = vDiff / r;
        } else if (c.type === "battery" || c.type === "ac_source") {
          const idx = vSources.findIndex((vs) => vs.id === c.id);
          current = result[nodeCount + idx] || 0;
          totalI += Math.abs(current);
        } else if (c.type === "switch") {
          current = vDiff / (c.isOpen ? 1e9 : 1e-4);
        } else if (c.type === "capacitor") {
          const g = (c.value || 1e-6) / dt;
          const vPrev = stateVariablesRef.current[c.id] || 0;
          current = g * (vDiff - vPrev);
          stateVariablesRef.current[c.id] = vDiff;
        } else if (c.type === "inductor") {
          const g = dt / (c.value || 1e-3);
          const iPrev = stateVariablesRef.current[c.id] || 0;
          const iNew = iPrev + g * vDiff;
          current = iNew;
          stateVariablesRef.current[c.id] = iNew;
        }

        const absI = Math.abs(current);
        if (absI > maxSingleComponentCurrent) maxSingleComponentCurrent = absI;

        totalP += vDrop * absI;
        if (!Number.isFinite(current)) current = 0;
        current = Math.max(-1000, Math.min(1000, current));

        return {
          ...c,
          current,
          voltageDrop: vDrop,
          power: vDrop * absI,
          nodes: [`node_${n1}`, `node_${n2}`] as [string, string],
        };
      });

      // SAFETY CHECK: De Zekering
      const tripped = maxSingleComponentCurrent > TRIP_CURRENT_THRESHOLD;

      const newNodes: Record<string, { voltage: number }> = {};
      for (let i = 0; i < nodeCount; i++)
        newNodes[`node_${i}`] = { voltage: result[i] || 0 };

      const nodeVoltages = new Array(nodeCount);
      for (let i = 0; i < nodeCount; i++) nodeVoltages[i] = result[i];

      return {
        nodes: newNodes,
        components: updatedComponents,
        totalPower: totalP,
        totalCurrent: totalI,
        nodeVoltages,
        tripped: tripped,
      };
    },
    [state.nodes, state.nodeVoltages],
  );

  // De Main Loop met Safety Trip
  useEffect(() => {
    if (!state.isPlaying || state.isTripped) return;

    let frameId: number;
    let frameCount = 0;

    const run = () => {
      setModuleState((prevState: CircuitState) => {
        const currentS = prevState || DEFAULT_STATE;

        if (currentS.isTripped) return currentS;

        const PHYSICS_SUBSTEPS = 10;
        const dt = 0.001;
        let nextTime = currentS.time;
        let results: ReturnType<typeof solveCircuit> | undefined;

        for (let i = 0; i < PHYSICS_SUBSTEPS; i++) {
          nextTime += dt;
          results = solveCircuit(currentS.components || [], nextTime);
          if (!results) continue;

          if (results.tripped) {
            return {
              ...currentS,
              isPlaying: false,
              isTripped: true,
              error: "SHORT_CIRCUIT_DETECTED",
              components: results.components,
            };
          }
        }

        if (!results) return currentS;

        const monitoredComp =
          results.components.find(
            (c: CircuitComponent) => c.id === currentS.selectedId,
          ) || results.components[0];
        const hist = historyRef.current;
        hist.push({
          t: nextTime,
          V: monitoredComp?.voltageDrop || 0,
          I: monitoredComp?.current || 0,
        });
        if (hist.length > 500) hist.shift();

        latestVoltagesRef.current = Object.fromEntries(
          Object.entries(results.nodes).map(([k, v]) => [
            k,
            (v as { voltage: number }).voltage,
          ]),
        );

        frameCount++;
        if (frameCount % 3 !== 0) return currentS;

        return {
          ...currentS,
          time: nextTime,
          nodes: results.nodes,
          components: results.components,
          totalPower: results.totalPower,
          totalCurrent: results.totalCurrent,
          nodeVoltages: results.nodeVoltages,
          isTripped: false,
          error: null,
        };
      });

      frameId = requestAnimationFrame(run);
    };

    frameId = requestAnimationFrame(run);
    return () => cancelAnimationFrame(frameId);
  }, [state.isPlaying, state.isTripped, solveCircuit, setModuleState]);

  const reset = useCallback(() => {
    setModuleState(() => ({
      ...DEFAULT_STATE,
      components: [],
      isTripped: false,
      error: null,
    }));
    historyRef.current = [];
    stateVariablesRef.current = {};
  }, [setModuleState]);

  const resetFuse = useCallback(() => {
    setModuleState((s: CircuitState) => ({
      ...s,
      isTripped: false,
      error: null,
      isPlaying: false,
    }));
  }, [setModuleState]);

  const addComponent = useCallback(
    (type: ComponentType) => {
      setModuleState((s: CircuitState) => {
        const currentComponents = s.components || [];
        const id = Math.random().toString(36).substr(2, 9);
        const count = currentComponents.length;
        const jitter = (Math.random() - 0.5) * 0.2;

        const newComp: CircuitComponent = {
          id,
          type,
          pos: [count * 0.5 + jitter, 0, jitter],
          rotation: 0,
          nodes: ["ground", "ground"],
          value: 10,
          pinOffset: 0.5,
        };

        if (type === "battery") newComp.value = 9;
        if (type === "ac_source") {
          newComp.value = 230;
          newComp.frequency = 2;
        }
        if (type === "resistor") newComp.value = 220;
        if (type === "bulb") newComp.value = 60;
        if (type === "wire") newComp.value = 0.001;
        if (type === "switch") {
          newComp.isOpen = true;
          newComp.value = 0;
        }
        if (type === "capacitor") newComp.value = 0.0001;
        if (type === "inductor") newComp.value = 0.1;
        if (type === "ldr") {
          newComp.externalFactor = 0.5;
          newComp.value = 1000;
        }
        if (type === "ntc") {
          newComp.externalFactor = 0.5;
          newComp.value = 1000;
        }

        return { ...s, components: [...currentComponents, newComp] };
      });
    },
    [setModuleState],
  );

  const removeComponent = useCallback(
    (id: string) => {
      setModuleState((s: CircuitState) => ({
        ...s,
        components: (s.components || []).filter(
          (c: CircuitComponent) => c.id !== id,
        ),
        selectedId: s.selectedId === id ? null : s.selectedId,
      }));
    },
    [setModuleState],
  );

  const updateComponentValue = useCallback(
    (id: string, value: number) => {
      setModuleState((s: CircuitState) => ({
        ...s,
        components: (s.components || []).map((c: CircuitComponent) =>
          c.id === id ? { ...c, value } : c,
        ),
      }));
    },
    [setModuleState],
  );

  const updateComponentFreq = useCallback(
    (id: string, frequency: number) => {
      setModuleState((s: CircuitState) => ({
        ...s,
        components: (s.components || []).map((c: CircuitComponent) =>
          c.id === id ? { ...c, frequency } : c,
        ),
      }));
    },
    [setModuleState],
  );

  const updateComponentExternal = useCallback(
    (id: string, externalFactor: number) => {
      setModuleState((s: CircuitState) => ({
        ...s,
        components: (s.components || []).map((c: CircuitComponent) =>
          c.id === id ? { ...c, externalFactor } : c,
        ),
      }));
    },
    [setModuleState],
  );

  const setParam = useCallback(
    <K extends keyof CircuitState>(key: K, val: CircuitState[K]) => {
      setModuleState((s: CircuitState) => ({ ...s, [key]: val }));
    },
    [setModuleState],
  );

  const toggleSwitch = useCallback(
    (id: string) => {
      setModuleState((s: CircuitState) => ({
        ...s,
        components: (s.components || []).map((c: CircuitComponent) =>
          c.id === id ? { ...c, isOpen: !c.isOpen } : c,
        ),
      }));
    },
    [setModuleState],
  );

  const updateComponentRotation = useCallback(
    (id: string, rotation: number) => {
      setModuleState((s: CircuitState) => ({
        ...s,
        components: (s.components || []).map((c: CircuitComponent) =>
          c.id === id ? { ...c, rotation } : c,
        ),
      }));
    },
    [setModuleState],
  );

  const updateComponentPos = useCallback(
    (id: string, pos: [number, number, number]) => {
      setModuleState((s: CircuitState) => ({
        ...s,
        components: (s.components || []).map((c: CircuitComponent) =>
          c.id === id ? { ...c, pos } : c,
        ),
      }));
    },
    [setModuleState],
  );

  return {
    state,
    setParam,
    addComponent,
    removeComponent,
    updateComponentValue,
    updateComponentFreq,
    updateComponentExternal,
    updateComponentRotation,
    reset,
    resetFuse, // Nieuwe export
    toggleSwitch,
    updateComponentPos,
    history: historyRef,
    latestVoltagesRef,
  };
};

function solveGaussianFlat(
  A: Float64Array,
  b: Float64Array,
  x: Float64Array,
  n: number,
) {
  for (let i = 0; i < n; i++) {
    let max = i;
    let maxVal = Math.abs(A[i * MAX_NODES + i] || 0);
    for (let j = i + 1; j < n; j++) {
      const val = Math.abs(A[j * MAX_NODES + i] || 0);
      if (val > maxVal) {
        max = j;
        maxVal = val;
      }
    }
    if (max !== i) {
      for (let k = i; k < n; k++) {
        const tmp = A[i * MAX_NODES + k] || 0;
        A[i * MAX_NODES + k] = A[max * MAX_NODES + k] || 0;
        A[max * MAX_NODES + k] = tmp;
      }
      const tmpB = b[i] || 0;
      b[i] = b[max] || 0;
      b[max] = tmpB;
    }
    if (Math.abs(A[i * MAX_NODES + i]!) < 1e-12) continue;
    for (let j = i + 1; j < n; j++) {
      const factor = (A[j * MAX_NODES + i] || 0) / (A[i * MAX_NODES + i] || 1);
      b[j] = (b[j] || 0) - factor * (b[i] || 0);
      for (let k = i; k < n; k++) {
        A[j * MAX_NODES + k] =
          (A[j * MAX_NODES + k] || 0) - factor * (A[i * MAX_NODES + k] || 0);
      }
    }
  }
  for (let i = n - 1; i >= 0; i--) {
    if (Math.abs(A[i * MAX_NODES + i] || 0) < 1e-12) {
      x[i] = 0;
      continue;
    }
    let sum = 0;
    for (let j = i + 1; j < n; j++) {
      sum += (A[i * MAX_NODES + j] || 0) * (x[j] || 0);
    }
    x[i] = ((b[i] || 0) - sum) / (A[i * MAX_NODES + i] || 1);
  }
}
