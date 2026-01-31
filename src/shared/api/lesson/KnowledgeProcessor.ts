import { AIConfig } from "@shared/types/index";

import { logger } from "../../lib/logger";
import { resolveModel } from "../../lib/modelDefaults";
import { aiGenerate } from "../aiCascadeService";
import { knowledgeCache } from "./KnowledgeCache";

interface Material {
    id: string;
    content: string;
    name: string;
}

interface MapReduceOptions {
    topic: string;
    intent: string;
    aiConfig?: AIConfig;
    // Progress feedback mechanism
    onProgress?: (stage: string, percentage: number) => void;
    // Granular status updates (e.g. rate limit wait)
    onStatus?: (status: string, message: string) => void;
}

/**
 * Knowledge Processor
 * Responsible for handling massive amounts of information via 
 * intelligent batching and Map-Reduce strategies.
 */
export class KnowledgeProcessor {
    // ELITE CLUSTER LIMITS: 
    // We use 4k tokens (16k chars) per map-batch to ensure compatibility with 
    // Groq Free Tier (6k TPM) and other small-context providers.
    // ELITE CLUSTER LIMITS: 
    // We use a safe threshold to prevent TPM (Tokens Per Minute) 429s on Gemini Free Tier.
    // 100k chars ≈ 25k tokens. 15 RPM * 25k = 375k TPM (Safe below 1M TPM limit).
    private readonly DEFAULT_CHUNK_LIMIT = 100000;
    private readonly MAX_REDUCTION_WORDS = 1500;

    private getDynamicChunkLimit(aiConfig?: AIConfig): number {
        const model = resolveModel("gemini", "reasoning", aiConfig);
        // Gemini 1.5 Pro has a massive context window (1M-2M tokens).
        // We can safely use 1M chars (~250k tokens) per batch.
        if (model.includes("pro")) {
            return 1000000;
        }
        return this.DEFAULT_CHUNK_LIMIT;
    }

    /**
     * Main Function: Digest materials into a refined context for the lesson.
     */
    public async digestMaterials(
        materials: Material[],
        options: MapReduceOptions
    ): Promise<string> {
        // 0. CACHE CHECK (Elite Optimization: Content-Based Hashing)
        const materialHashes = await Promise.all(
            materials.map(m => knowledgeCache.generateContentHash(m.content))
        );
        const cacheKey = knowledgeCache.generateKey(materialHashes, options.topic);

        const cachedResult = knowledgeCache.get(cacheKey);
        if (cachedResult) {
            logger.info(`[Knowledge] Skipping processing, using cached digest.`);
            options.onProgress?.("Ophalen uit neurale cache...", 100);
            return cachedResult;
        }

        const chunkLimit = this.getDynamicChunkLimit(options.aiConfig);

        // 1. Calculate total size
        const totalChars = materials.reduce((acc, m) => acc + m.content.length, 0);

        let result = "";

        // 2. Direct Path: If small enough, return everything immediately.
        if (totalChars < chunkLimit) {
            logger.info(`[Knowledge] Direct path used (${totalChars} chars).`);
            result = this.formatDirectContext(materials);
        }
        // 3. Map-Reduce Path
        else {
            logger.info(`[Knowledge] Map-Reduce triggered. Content size: ${totalChars} chars. Chunk Limit: ${chunkLimit}`);
            result = await this.executeMapReduce(materials, options, chunkLimit);
        }

        // 4. SAVE TO CACHE
        knowledgeCache.set(cacheKey, result);

        return result;
    }

    /**
     * Map Phase: Analyze chunks in parallel via ConcurrencyManager
     */
    private async executeMapReduce(
        materials: Material[],
        options: MapReduceOptions,
        chunkLimit: number
    ): Promise<string> {

        // A. Create Batches (Greedy Packing)
        const batches = this.createBatches(materials, chunkLimit);
        logger.info(`[Knowledge] Created ${batches.length} batches.`);

        // ELITE UX: Immediate feedback on total clusters
        options.onProgress?.(`Voorbereiden van ${batches.length} clusters...`, 15);

        let completedBatches = 0;

        // B. Map (Parallel processing with Chunk Caching)
        const summaries = await Promise.all(batches.map(async (batch, idx) => {
            // ELITE RECOVERY: Check for individual chunk cache hit
            const chunkIds = batch.map(m => m.id);
            const chunkKey = knowledgeCache.generateKey(chunkIds, `${options.topic}-chunk-${idx}`);
            const cachedChunk = knowledgeCache.get(chunkKey);

            if (cachedChunk) {
                completedBatches++;
                const progress = 10 + Math.round((completedBatches / batches.length) * 60);
                options.onProgress?.(`Cluster ${completedBatches}/${batches.length} uit cache hersteld...`, progress);
                return cachedChunk;
            }

            // UI feedback
            if (idx === 0) {
                options.onProgress?.(`Analyseren van cluster 1/${batches.length}...`, 15);
            }

            const batchContent = batch.map(m =>
                `--- SOURCE: ${m.name} ---\n${m.content}`
            ).join("\n\n");

            const prompt = `
          ANALYSE THE FOLLOWING STUDY MATERIALS FOR THE TOPIC: "${options.topic}".
          GOAL: ${options.intent}.
          
          TASK:
          Extract crucial facts, definitions, core arguments, and chronology.
          Ignore irrelevant noise.
          Output as a clean, structured summary.
          STRICT LIMIT: Maximum ${this.MAX_REDUCTION_WORDS} words per summary.
          
          SOURCES:
          ${batchContent}
        `;

            const response = await aiGenerate(prompt, {
                aiConfig: options.aiConfig,
                temperature: 0.3,
                onStatus: (status, msg) => {
                    if (status === "waiting") {
                        const progress = 10 + Math.round((completedBatches / batches.length) * 60);
                        options.onProgress?.(msg, progress);
                    }
                }
            });

            // ELITE PERSISTENCE: Save successful chunk
            knowledgeCache.set(chunkKey, response);

            completedBatches++;
            const progress = 10 + Math.round((completedBatches / batches.length) * 60);
            options.onProgress?.(`Analyseren van cluster ${completedBatches}/${batches.length}...`, progress);

            return response;
        }));

        // C. Reduce (Aggregation)
        options.onProgress?.("Samenvoegen van kennis...", 75);
        let combinedKnowledge = summaries.join("\n\n=== NEXT BATCH SUMMARY ===\n\n");

        // ELITE FIX: Recursive Reduction if the aggregate result is still "Heavy"
        // This ensures the final lesson prompt never exceeds provider limits.
        if (combinedKnowledge.length > chunkLimit) {
            logger.info(`[Knowledge] Recursive reduction triggered. Aggregated size: ${combinedKnowledge.length} chars.`);
            options.onProgress?.("Kennis verfijnen (extra pass)...", 80);

            const subMaterials: Material[] = summaries.map((s, idx) => ({
                id: `summary-${idx}`,
                content: s,
                name: `Summary Batch ${idx + 1}`
            }));

            combinedKnowledge = await this.executeMapReduce(subMaterials, {
                ...options,
                intent: `The following are summaries of different parts of the material. 
                         YOUR TASK: Synthesize them into a single, cohesive, academic master-summary. 
                         Focus on connections and overarching themes.`
            }, chunkLimit);
        }

        return `
      [META-CONTEXT: This is a synthesized master-summary of ${materials.length} large source files]
      
      ${combinedKnowledge}
    `;
    }

    /**
     * Smart Batching Algorithm (Greedy Packing + Hard Splitting)
     * 
     * ELITE FIX: Originally this only packed small materials. 
     * Now it splits massive materials into manageable clusters.
     */
    private createBatches(materials: Material[], chunkLimit: number): Material[][] {
        const batches: Material[][] = [];
        let currentBatch: Material[] = [];
        let currentSize = 0;

        for (const mat of materials) {
            // Case 1: Material itself is a behemoth (e.g. 7M chars)
            if (mat.content.length > chunkLimit) {
                // A. Flush current batch if not empty
                if (currentBatch.length > 0) {
                    batches.push(currentBatch);
                    currentBatch = [];
                    currentSize = 0;
                }

                // B. Hard-split this material into sub-chunks
                logger.info(`[Knowledge] Hard-splitting massive material: ${mat.name} (${mat.content.length} chars)`);
                let start = 0;
                while (start < mat.content.length) {
                    const chunkContent = mat.content.substring(start, start + chunkLimit);
                    batches.push([{
                        id: `${mat.id}-part-${start}`,
                        name: `${mat.name} (Part ${Math.floor(start / chunkLimit) + 1})`,
                        content: chunkContent
                    }]);
                    start += chunkLimit;
                }
                continue;
            }

            // Case 2: Standard packing
            if (currentSize + mat.content.length > chunkLimit && currentBatch.length > 0) {
                batches.push(currentBatch);
                currentBatch = [];
                currentSize = 0;
            }

            currentBatch.push(mat);
            currentSize += mat.content.length;
        }

        if (currentBatch.length > 0) {
            batches.push(currentBatch);
        }

        return batches;
    }

    private formatDirectContext(materials: Material[]): string {
        return materials.map(m => `--- SOURCE: ${m.name} ---\n${m.content}`).join("\n\n");
    }
}

export const knowledgeProcessor = new KnowledgeProcessor();
