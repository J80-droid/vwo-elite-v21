import { BINAS_DATA } from "@shared/assets/data/BinasData";
import { MOLECULES } from "@shared/assets/data/molecules";
import { FORMULAS } from "@shared/lib/data/formulas";

const MOLECULE_MAP = new Map(((MOLECULES as unknown) as Record<string, unknown>[]).map(m => [String(m.nameDutch).toLowerCase().replace(/\s+/g, "_"), m]));
const FORMULA_MAP = new Map(FORMULAS.map(f => [f.id, f]));

/**
 * MCP Resource Manager
 * Handles resolution of educational data URIs with O(1) lookup performance.
 */
export const mcpResourceManager = {
  /**
   * Resolve an MCP URI to actual data
   */
  async getResource(uri: string): Promise<unknown> {
    const parts = uri.split("://");
    if (parts.length < 2) return { success: false, error: `Invalid MCP URI: ${uri}` };
    const protocol = parts[0];
    const path = parts[1]!;

    switch (protocol) {
      case "binas":
        return this.resolveBinas(path);
      case "molecules":
        return this.resolveMolecules(path);
      case "formulas":
        return this.resolveFormulas(path);
      default:
        return { success: false, error: `Unsupported protocol: ${protocol}` };
    }
  },

  /**
   * List available resources for discovery
   */
  async listResources(): Promise<string[]> {
    return [
      ...Object.keys(BINAS_DATA).map((id) => `binas://${id}`),
      ...Array.from(MOLECULE_MAP.keys()).map(name => `molecules://${name}`),
      ...FORMULAS.map((f) => `formulas://${f.id}`),
    ];
  },

  resolveBinas(tableId: string) {
    const data = (BINAS_DATA as Record<string, unknown>)[tableId];
    if (!data) return { success: false, error: `Binas table not found: ${tableId}` };
    return {
      success: true,
      type: "application/json",
      content: JSON.stringify({ id: tableId, ...(data as object) }, null, 2),
    };
  },

  resolveMolecules(moleculeName: string) {
    const molecule = MOLECULE_MAP.get(moleculeName);
    if (!molecule) return { success: false, error: `Molecule not found: ${moleculeName}` };
    return {
      success: true,
      type: "application/json",
      content: JSON.stringify(molecule, null, 2),
    };
  },

  resolveFormulas(formulaId: string) {
    const formula = FORMULA_MAP.get(formulaId);
    if (!formula) return { success: false, error: `Formula not found: ${formulaId}` };
    return {
      success: true,
      type: "application/json",
      content: JSON.stringify(formula, null, 2),
    };
  },
};
