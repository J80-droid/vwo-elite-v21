/**
 * AlphaFold Service
 * Protein structure prediction and visualization
 * Uses EBI AlphaFold Database API (free, no API key required)
 * Part of the 750% Elite Intelligence Upgrade - Wetenschappelijke AI
 */

// =============================================================================
// TYPES
// =============================================================================

export interface ProteinStructure {
    uniprotId: string;
    entryName: string;
    organism: string;
    geneName: string;
    pdbUrl: string;
    cifUrl: string;
    bcifUrl: string;
    paeImageUrl: string;
    confidenceLevel: "very_high" | "confident" | "low" | "very_low";
    averageConfidence: number;
    sequenceLength: number;
    latestVersion: number;
}

export interface ProteinSearchResult {
    uniprotId: string;
    entryName: string;
    organism: string;
    proteinName: string;
    geneName?: string;
    sequenceLength?: number;
    pdbUrl?: string; // Loaded via API to ensure validity
}

export interface ProteinSequence {
    sequence: string;
    length: number;
    checksum: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ALPHAFOLD_API = "https://alphafold.ebi.ac.uk/api";
const UNIPROT_API = "https://rest.uniprot.org/uniprotkb";

// =============================================================================
// SEARCH FUNCTIONS
// =============================================================================

/**
 * Search for proteins by name, gene, or sequence
 * Uses UniProt API for comprehensive search
 */
export async function searchProteins(
    query: string,
    options?: {
        organism?: string;
        limit?: number;
        includeFragments?: boolean;
    },
): Promise<ProteinSearchResult[]> {
    const limit = options?.limit || 10;

    // Build search query
    let searchQuery = query;

    // Add organism filter if provided
    if (options?.organism) {
        searchQuery += ` AND organism_name:${options.organism}`;
    }

    // Exclude fragments by default for cleaner results
    if (!options?.includeFragments) {
        searchQuery += " AND fragment:false";
    }

    const url = `${UNIPROT_API}/search?query=${encodeURIComponent(searchQuery)}&format=json&size=${limit}&fields=accession,id,organism_name,protein_name,gene_names,length`;

    const response = await fetch(url);

    if (!response.ok) {
        if (response.status === 400) {
            throw new Error(`Invalid search query: ${query}`);
        }
        throw new Error(`UniProt search failed: ${response.status}`);
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
        return [];
    }

    return data.results.map(
        (r: {
            primaryAccession: string;
            uniProtkbId: string;
            organism?: { scientificName: string };
            proteinDescription?: {
                recommendedName?: { fullName?: { value: string } };
                submissionNames?: Array<{ fullName?: { value: string } }>;
            };
            genes?: Array<{ geneName?: { value: string } }>;
            sequence?: { length: number };
        }) => ({
            uniprotId: r.primaryAccession,
            entryName: r.uniProtkbId,
            organism: r.organism?.scientificName || "Unknown",
            proteinName:
                r.proteinDescription?.recommendedName?.fullName?.value ||
                r.proteinDescription?.submissionNames?.[0]?.fullName?.value ||
                r.uniProtkbId,
            geneName: r.genes?.[0]?.geneName?.value,
            sequenceLength: r.sequence?.length,
        }),
    );
}

/**
 * Search for common proteins by name (curated list)
 * Useful for educational purposes with well-known proteins
 */
export function getCommonProteins(): ProteinSearchResult[] {
    return [
        {
            uniprotId: "P01308",
            entryName: "INS_HUMAN",
            organism: "Homo sapiens",
            proteinName: "Insulin",
            geneName: "INS",
        },
        {
            uniprotId: "P69905",
            entryName: "HBA_HUMAN",
            organism: "Homo sapiens",
            proteinName: "Hemoglobin subunit alpha",
            geneName: "HBA1",
        },
        {
            uniprotId: "P02768",
            entryName: "ALBU_HUMAN",
            organism: "Homo sapiens",
            proteinName: "Serum albumin",
            geneName: "ALB",
        },
        {
            uniprotId: "P04637",
            entryName: "P53_HUMAN",
            organism: "Homo sapiens",
            proteinName: "Cellular tumor antigen p53",
            geneName: "TP53",
        },
        {
            uniprotId: "P0DTC2",
            entryName: "SPIKE_SARS2",
            organism: "SARS-CoV-2",
            proteinName: "Spike glycoprotein (COVID-19)",
            geneName: "S",
        },
        {
            uniprotId: "P00533",
            entryName: "EGFR_HUMAN",
            organism: "Homo sapiens",
            proteinName: "Epidermal growth factor receptor",
            geneName: "EGFR",
        },
        {
            uniprotId: "P01375",
            entryName: "TNFA_HUMAN",
            organism: "Homo sapiens",
            proteinName: "Tumor necrosis factor",
            geneName: "TNF",
        },
        {
            uniprotId: "P68871",
            entryName: "HBB_HUMAN",
            organism: "Homo sapiens",
            proteinName: "Hemoglobin subunit beta",
            geneName: "HBB",
        },
    ];
}

// =============================================================================
// STRUCTURE FUNCTIONS
// =============================================================================

/**
 * Get protein structure from AlphaFold database
 * Returns detailed structure information including PDB/CIF URLs
 */
export async function getProteinStructure(
    uniprotId: string,
): Promise<ProteinStructure | null> {
    const response = await fetch(`${ALPHAFOLD_API}/prediction/${uniprotId}`);

    if (!response.ok) {
        if (response.status === 404) {
            console.log(
                `[AlphaFold] No structure found for ${uniprotId} - may not be in database`,
            );
            return null;
        }
        throw new Error(`AlphaFold API error: ${response.status}`);
    }

    const data = await response.json();
    const entry = Array.isArray(data) ? data[0] : data;

    if (!entry) {
        return null;
    }

    return {
        uniprotId: entry.uniprotAccession,
        entryName: entry.uniprotId,
        organism: entry.organismScientificName,
        geneName: entry.gene || "",
        pdbUrl: entry.pdbUrl,
        cifUrl: entry.cifUrl,
        bcifUrl: entry.bcifUrl,
        paeImageUrl: entry.paeImageUrl,
        confidenceLevel: mapConfidence(entry.globalMetricValue),
        averageConfidence: entry.globalMetricValue || 0,
        sequenceLength: entry.uniprotEnd - entry.uniprotStart + 1,
        latestVersion: entry.latestVersion || 1,
    };
}

/**
 * Check if a protein has an AlphaFold structure available
 */
export async function hasAlphaFoldStructure(
    uniprotId: string,
): Promise<boolean> {
    try {
        const response = await fetch(`${ALPHAFOLD_API}/prediction/${uniprotId}`, {
            method: "HEAD",
        });
        return response.ok;
    } catch {
        return false;
    }
}

/**
 * Get multiple protein structures in batch
 */
export async function getProteinStructures(
    uniprotIds: string[],
): Promise<Map<string, ProteinStructure | null>> {
    const results = new Map<string, ProteinStructure | null>();

    // Process in parallel with concurrency limit
    const BATCH_SIZE = 5;

    for (let i = 0; i < uniprotIds.length; i += BATCH_SIZE) {
        const batch = uniprotIds.slice(i, i + BATCH_SIZE);
        const promises = batch.map((id) =>
            getProteinStructure(id)
                .then((s) => ({ id, structure: s }))
                .catch(() => ({ id, structure: null })),
        );

        const batchResults = await Promise.all(promises);
        batchResults.forEach(({ id, structure }) => {
            results.set(id, structure);
        });
    }

    return results;
}

// =============================================================================
// SEQUENCE FUNCTIONS
// =============================================================================

/**
 * Get amino acid sequence for a protein
 */
export async function getProteinSequence(
    uniprotId: string,
): Promise<ProteinSequence> {
    const response = await fetch(`${UNIPROT_API}/${uniprotId}.fasta`);

    if (!response.ok) {
        throw new Error(`Failed to fetch sequence for ${uniprotId}`);
    }

    const fasta = await response.text();

    // Parse FASTA format (remove header and newlines)
    const lines = fasta.split("\n");
    const sequence = lines.slice(1).join("").trim();

    // Calculate simple checksum
    let checksum = 0;
    for (let i = 0; i < sequence.length; i++) {
        checksum = (checksum + sequence.charCodeAt(i)) % 65535;
    }

    return {
        sequence,
        length: sequence.length,
        checksum: checksum.toString(16).padStart(4, "0"),
    };
}

// =============================================================================
// VIEWER FUNCTIONS
// =============================================================================

/**
 * Get AlphaFold web viewer URL
 */
export function getAlphaFoldViewerUrl(uniprotId: string): string {
    return `https://alphafold.ebi.ac.uk/entry/${uniprotId}`;
}

/**
 * Get Mol* 3D viewer embed URL (PDBe)
 * This can be embedded in an iframe
 */
export function getMolStarViewerUrl(uniprotId: string): string {
    return `https://www.ebi.ac.uk/pdbe/pdbe-molstar/plugins/af?superposition=0&lighting=metallic&af-id=${uniprotId}`;
}

/**
 * Get direct PDB file URL for download
 */
export function getPdbDownloadUrl(uniprotId: string, version?: number): string {
    const v = version || 4;
    return `https://alphafold.ebi.ac.uk/files/AF-${uniprotId}-F1-model_v${v}.pdb`;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function mapConfidence(
    score: number,
): ProteinStructure["confidenceLevel"] {
    if (score >= 90) return "very_high";
    if (score >= 70) return "confident";
    if (score >= 50) return "low";
    return "very_low";
}

/**
 * Get confidence level color for UI display
 */
export function getConfidenceColor(
    level: ProteinStructure["confidenceLevel"],
): string {
    switch (level) {
        case "very_high":
            return "#0053d6"; // Blue
        case "confident":
            return "#65cbf3"; // Cyan
        case "low":
            return "#ffdb13"; // Yellow
        case "very_low":
            return "#ff7d45"; // Orange
        default:
            return "#888888"; // Gray
    }
}

/**
 * Get confidence level description (Dutch for VWO students)
 */
export function getConfidenceDescription(
    level: ProteinStructure["confidenceLevel"],
): string {
    switch (level) {
        case "very_high":
            return "Zeer hoge betrouwbaarheid (pLDDT > 90)";
        case "confident":
            return "Betrouwbaar (pLDDT 70-90)";
        case "low":
            return "Lage betrouwbaarheid (pLDDT 50-70)";
        case "very_low":
            return "Erg onzeker (pLDDT < 50)";
        default:
            return "Onbekend";
    }
}
