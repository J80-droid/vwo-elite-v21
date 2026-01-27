import { aiGenerate } from "../../aiCascadeService";

/**
 * Handle Natural Sciences tool execution
 */
export async function handleScienceTool(
  name: string,
  params: Record<string, unknown>,
): Promise<unknown> {
  switch (name) {
    case "balance_equation":
      return await balanceEquation(String(params.equation));
    case "lookup_periodic_table":
      return await lookupPeriodicTable(String(params.symbol));
    case "lookup_binas":
      return await lookupBinas(String(params.query));
    case "physics_formula_helper":
      return await physicsFormulaHelper(String(params.problem));
    case "simulate_physics":
      return await simulatePhysics(String(params.scenario), params.parameters);
    case "molecule_visualizer":
      return await visualizeMolecule(String(params.name));
    case "biology_diagram": {
      const res = await generateBiologyDiagram(String(params.concept));
      return { success: true, ...res };
    }
    case "protein_structure": {
      const res = await proteinStructure(
        String(params.protein_name),
        String(params.organism || ""),
      );
      return { success: !res.error, ...res };
    }
    default:
      throw new Error(`Science tool ${name} not implemented.`);
  }
}

async function proteinStructure(proteinName: string, organism?: string) {
  const { searchProteins, getProteinStructure, getAlphaFoldViewerUrl } =
    await import("../../alphafoldService");

  try {
    const results = await searchProteins(proteinName, { organism, limit: 3 });

    if (results.length === 0) {
      return { error: `Geen eiwitten gevonden voor "${proteinName}"` };
    }

    const first = results[0]!;
    const structure = await getProteinStructure(first.uniprotId);

    if (!structure) {
      return {
        protein: first,
        error: "AlphaFold structuur nog niet beschikbaar voor dit eiwit.",
      };
    }

    return {
      protein: {
        name: structure.entryName,
        fullName: first.proteinName,
        organism: structure.organism,
        gene: structure.geneName,
        length: structure.sequenceLength,
      },
      structure: {
        confidence: structure.confidenceLevel,
        averageConfidence: structure.averageConfidence.toFixed(1),
        pdbUrl: structure.pdbUrl,
        viewerUrl: getAlphaFoldViewerUrl(structure.uniprotId),
      },
      alternatives: results.slice(1).map((r) => r.proteinName),
      instruction: `Bekijk de 3D-structuur van ${structure.entryName} in de Protein Explorer.`,
    };
  } catch (error) {
    console.error("Tool protein_structure failed:", error);
    return { error: "Failed to fetch protein structure data." };
  }
}

async function balanceEquation(equation: string) {
  const prompt = `Balanceer de volgende chemische reactievergelijking: "${equation}". 
  Geef de gebalanceerde vergelijking en leg kort uit welke stappen je hebt genomen.`;
  const systemPrompt =
    "Je bent een scheikunde expert die reactievergelijkingen nauwkeurig balanceert.";

  const content = await aiGenerate(prompt, { systemPrompt });
  return { original: equation, balanced: content };
}

async function lookupPeriodicTable(symbol: string) {
  const prompt = `Geef de belangrijkste eigenschappen van het element met symbool "${symbol}" (atoomnummer, atoommassa, configuratie, eigenschappen). 
  Noem ook een veelvoorkomende toepassing in de praktijk.`;
  const systemPrompt =
    "Je bent een expert in anorganische chemie en het periodiek systeem.";

  const content = await aiGenerate(prompt, { systemPrompt });
  return { symbol, data: content };
}

async function lookupBinas(query: string) {
  const prompt = `Zoek de relevante informatie of tabelnummers in BINAS (6e editie) voor de volgende vraag: "${query}". 
  Geef indien mogelijk de specifieke waarden of constanten die nodig zijn.`;
  const systemPrompt =
    "Je bent een expert in het gebruik van de BINAS voor natuurkunde, scheikunde en biologie.";

  const content = await aiGenerate(prompt, { systemPrompt });
  return { query, binas_info: content };
}

async function physicsFormulaHelper(problem: string) {
  const prompt = `Welke natuurkundeformules zijn relevant voor het volgende probleem: "${problem}"? 
  Leg uit wat elke variabele in de formules betekent en hoe ze toegepast moeten worden.`;
  const systemPrompt =
    "Je bent een natuurkunde docent die leerlingen helpt de juiste formules te vinden en te begrijpen.";

  const content = await aiGenerate(prompt, { systemPrompt });
  return { problem, formulas: content };
}

async function simulatePhysics(scenario: string, parameters: unknown) {
  const prompt = `Voer een mentale simulatie uit voor het volgende natuurkunde scenario: "${scenario}". 
  Gebruik de volgende parameters: ${JSON.stringify(parameters)}. 
  Wat zijn de verwachte resultaten en welke natuurwetten zijn hier van toepassing?`;

  const content = await aiGenerate(prompt, {
    systemPrompt:
      "Je bent een expert in natuurkundige simulaties en modelvorming.",
  });
  return { scenario, parameters, simulation_result: content };
}
async function visualizeMolecule(name: string) {
  // Attempt to resolve real molecule data from our database
  try {
    const { mcpResourceManager } = await import("../mcpResourceManager");
    const molecule = await mcpResourceManager.getResource(
      `molecules://${name.toLowerCase().replace(/\s+/g, "_")}`,
    );
    return {
      name,
      data: JSON.parse((molecule as { content: string }).content),
      mode: "ball-and-stick",
      instruction: "Open de 3D Molecuul viewer om deze structuur te bekijken.",
    };
  } catch (error) {
    console.warn(`Molecule lookup failed for ${name}:`, error);
    // Fallback to AI description if not in DB
    const content = await aiGenerate(
      `Beschrijf de moleculaire structuur van ${name} (atomen en verbindingen).`,
      { systemPrompt: "Je bent een expert in organische scheikunde." },
    );
    return {
      name,
      description: content,
      notice:
        "Molecuul niet direct gevonden in Elite-database, AI-beschrijving gegeven.",
    };
  }
}

async function generateBiologyDiagram(concept: string) {
  const prompt = `Genereer een Mermaid diagram code voor het biologische concept: "${concept}". 
Gebruik een flowchart (graph TD) of sequenceDiagram. Geef ALLEEN de Mermaid code terug.`;
  const systemPrompt =
    "Je bent een expert in biologische visualisaties en Mermaid syntax.";

  const content = await aiGenerate(prompt, { systemPrompt });
  return { concept, diagram_code: content, type: "mermaid" };
}
