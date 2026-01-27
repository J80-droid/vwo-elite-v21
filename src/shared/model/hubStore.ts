import { createStore } from "@shared/lib/storeFactory";

interface HubState {
  chemistryModuleOrder: string[];
  physicsModuleOrder: string[];
  biologyModuleOrder: string[];
  threeDModuleOrder: string[];
  mathModuleOrder: string[];
  setChemistryModuleOrder: (order: string[]) => void;
  setPhysicsModuleOrder: (order: string[]) => void;
  setBiologyModuleOrder: (order: string[]) => void;
  setThreeDModuleOrder: (order: string[]) => void;
  setMathModuleOrder: (order: string[]) => void;
}

export const useHubStore = createStore<
  HubState,
  {
    chemistryModuleOrder: string[];
    physicsModuleOrder: string[];
    biologyModuleOrder: string[];
    threeDModuleOrder: string[];
    mathModuleOrder: string[];
  }
>(
  (set) => ({
    chemistryModuleOrder: [],
    physicsModuleOrder: [],
    biologyModuleOrder: [],
    threeDModuleOrder: [],
    mathModuleOrder: [],
    setChemistryModuleOrder: (order) => set({ chemistryModuleOrder: order }),
    setPhysicsModuleOrder: (order) => set({ physicsModuleOrder: order }),
    setBiologyModuleOrder: (order) => set({ biologyModuleOrder: order }),
    setThreeDModuleOrder: (order) => set({ threeDModuleOrder: order }),
    setMathModuleOrder: (order) => set({ mathModuleOrder: order }),
  }),
  {
    name: "hub-layout",
    persistOptions: {
      partialize: (state) => ({
        chemistryModuleOrder: state.chemistryModuleOrder,
        physicsModuleOrder: state.physicsModuleOrder,
        biologyModuleOrder: state.biologyModuleOrder,
        threeDModuleOrder: state.threeDModuleOrder,
        mathModuleOrder: state.mathModuleOrder,
      }),
    },
  }
);
