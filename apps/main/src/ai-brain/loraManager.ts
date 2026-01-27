import type { Subject } from "@vwo/shared-types";
import { EventEmitter } from "events";

export interface LoRAAdapter {
  id: string;
  name: string;
  subject: Subject;
  baseModelId: string;
  adapterPath: string; // local path
  description: string;
  enabled: boolean;
}

export class LoRAManager extends EventEmitter {
  private adapters: LoRAAdapter[] = [];

  constructor() {
    super();
    this.initDefaultAdapters();
  }

  private initDefaultAdapters() {
    // These would normally be discovered from a folder or DB
    this.adapters = [
      {
        id: "lora-binas-physics",
        name: "Binas Physics Expert",
        subject: "natuurkunde",
        baseModelId: "llama-3-8b",
        adapterPath: "./adapters/physics-v1",
        description:
          "Speciaal getraind op Nederlandse Binas-data en examenopgaven.",
        enabled: true,
      },
      {
        id: "lora-binas-chem",
        name: "Binas Chemistry Expert",
        subject: "scheikunde",
        baseModelId: "llama-3-8b",
        adapterPath: "./adapters/chem-v1",
        description:
          "Expert in moleculaire structuren en reactievergelijkingen.",
        enabled: true,
      },
    ];
  }

  getAdapterForSubject(subject: Subject): LoRAAdapter | undefined {
    return this.adapters.find((a) => a.subject === subject && a.enabled);
  }

  getEnabledAdapters(): LoRAAdapter[] {
    return this.adapters.filter((a) => a.enabled);
  }
}

// Singleton
let instance: LoRAManager | null = null;
export function getLoRAManager() {
  if (!instance) instance = new LoRAManager();
  return instance;
}
