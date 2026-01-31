import { z } from "zod";
import { useCallback, useEffect, useState } from "react";
import { ModelStorageItem, NumericalModel, SavedModelMetadata } from "../types";

// --- Zod Schemas for Runtime Validation ---
const ModelConstantSchema = z.object({
  symbol: z.string(),
  value: z.number(),
  unit: z.string().optional(),
});

const ModelVariableSchema = z.object({
  symbol: z.string(),
  value: z.number(),
  unit: z.string().optional(),
  isState: z.boolean(),
});

const NumericalModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  timeStep: z.number(),
  duration: z.number(),
  constants: z.array(ModelConstantSchema),
  initialValues: z.array(ModelVariableSchema),
  equations: z.array(z.string()),
});

const ModelStorageItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  type: z.enum(["user", "scenario"]),
  createdAt: z.number(),
  updatedAt: z.number(),
  thumbnail: z.string().optional(),
  model: NumericalModelSchema,
});

const StorageSchema = z.array(ModelStorageItemSchema);

// DIDACTISCHE SEED DATA: De "Broken Models" die leerlingen moeten fixen
const SCENARIOS: ModelStorageItem[] = [
  {
    id: "scenario-bungee-bug",
    name: "Opdracht: De Dodellijke Bungeejump",
    description:
      "Dit model berekent de val, maar de springer remt nooit af. Zoek de fout in de modelregels.",
    type: "scenario",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    model: {
      id: "temp-bungee",
      name: "Bungeejump (Foutief)",
      equations: [
        "Fz = m * g",
        "Fveer = C * u",
        "Fres = Fz + Fveer", // FOUT: Moet min zijn (krachten werken tegen elkaar in)
        "a = Fres / m",
        "v = v + a * dt",
        "h = h - v * dt",
        "u = 100 - h", // Uitrekking begint pas als touw strak staat (versimpeld)
      ],
      constants: [
        { symbol: "m", value: 70, unit: "kg" },
        { symbol: "g", value: 9.81, unit: "m/s^2" },
        { symbol: "C", value: 150, unit: "N/m" },
      ],
      initialValues: [
        { symbol: "h", value: 100, unit: "m", isState: true },
        { symbol: "v", value: 0, unit: "m/s", isState: true },
        { symbol: "u", value: 0, unit: "m", isState: true }, // Uitrekking
      ],
      timeStep: 0.05,
      duration: 10,
    },
  },
  {
    id: "scenario-parachute",
    name: "Demo: Parachutesprong",
    description:
      "Een correct werkend model van luchtweerstand. Gebruik dit als referentie.",
    type: "scenario",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    model: {
      id: "temp-para",
      name: "Parachutesprong",
      equations: [
        "Fz = m * g",
        "Fwl = 0.5 * rho * Cw * A * v^2", // Kwadratische weerstand
        "Fres = Fz - Fwl",
        "a = Fres / m",
        "v = v + a * dt",
        "h = h - v * dt",
      ],
      constants: [
        { symbol: "m", value: 80, unit: "kg" },
        { symbol: "rho", value: 1.293, unit: "kg/m^3" }, // Luchtdichtheid
        { symbol: "Cw", value: 1.2, unit: "-" },
        { symbol: "A", value: 25, unit: "m^2" }, // Oppervlakte parachute
      ],
      initialValues: [
        { symbol: "v", value: 0, unit: "m/s", isState: true },
        { symbol: "h", value: 3000, unit: "m", isState: true },
      ],
      timeStep: 0.1,
      duration: 60,
    },
  },
];

const STORAGE_KEY = "physicslab_models_v1";

export const useModelStorage = () => {
  const [savedModels, setSavedModels] = useState<ModelStorageItem[]>([]);

  // 1. Initial Load & Seed
  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return setSavedModels(SCENARIOS);

        const parsed = JSON.parse(raw);

        // 🚀 ELITE VALIDATION: Filter corrupt data or fall back instead of crashing
        const result = StorageSchema.safeParse(parsed);

        if (!result.success) {
          console.warn("[ModelStorage] Corrupt data detected, recovering valid items...", result.error);
          setSavedModels(SCENARIOS);
        } else {
          const validItems = result.data;
          const hasScenarios = validItems.some((i) => i.type === "scenario");

          if (!hasScenarios) {
            setSavedModels([...SCENARIOS, ...validItems]);
          } else {
            setSavedModels(validItems);
          }
        }
      } catch (e) {
        console.error("Storage critical failure:", e);
        setSavedModels(SCENARIOS); // Safe fallback
      }
    };
    load();
  }, []);

  // 2. Save Model
  const saveModel = useCallback(
    (model: NumericalModel, metadata: Partial<SavedModelMetadata> = {}) => {
      setSavedModels((prev) => {
        const newItem: ModelStorageItem = {
          id: metadata.id || crypto.randomUUID(),
          name: metadata.name || model.name || "Naamloos Model",
          description: metadata.description || "",
          type: "user",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          model: { ...model },
        };

        // Overschrijf als ID bestaat, anders toevoegen
        const exists = prev.findIndex((p) => p.id === newItem.id);
        let newList;
        if (exists >= 0) {
          newList = [...prev];
          newList[exists] = newItem;
        } else {
          newList = [newItem, ...prev];
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
        return newList;
      });
    },
    [],
  );

  // 3. Delete Model
  const deleteModel = useCallback((id: string) => {
    setSavedModels((prev) => {
      const newList = prev.filter((m) => m.id !== id || m.type === "scenario"); // Scenario's zijn protected
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
      return newList;
    });
  }, []);

  // 4. Load Model (Simulatie)
  const getModel = useCallback(
    (id: string) => {
      return savedModels.find((m) => m.id === id)?.model;
    },
    [savedModels],
  );

  return {
    savedModels,
    saveModel,
    deleteModel,
    getModel,
  };
};
