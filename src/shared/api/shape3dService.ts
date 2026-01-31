/**
 * 3D Generation Service
 * Uses Replicate API for Shap-E model
 */

export interface Generate3DConfig {
    replicateApiKey: string;
    modelId?: string; // Replicate version ID
    prompt: string;
    format?: 'glb' | 'ply';
}

export interface Generate3DResult {
    meshUrl: string;
    format: string;
    prompt: string;
}

/**
 * Generate a 3D model from a text prompt using Shap-E (via Replicate)
 */
export async function generate3DModel(config: Generate3DConfig): Promise<Generate3DResult> {
    // 1. Create prediction
    const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
            'Authorization': `Token ${config.replicateApiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            // Use selected model version or default to Shap-E
            version: config.modelId || 'a8a8b6d5f6b3c1e2f3a4b5c6d7e8f9a0b1c2d3e4',
            input: {
                prompt: config.prompt,
                save_mesh: true,
                render_resolution: 128, // Fast preview
            },
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '3D generation failed to start');
    }

    const prediction = await response.json();

    // 2. Poll for completion
    let result = prediction;
    const startTime = Date.now();
    const TIMEOUT = 120000; // 2 minutes max

    while (result.status !== 'succeeded' && result.status !== 'failed') {
        if (Date.now() - startTime > TIMEOUT) {
            throw new Error('3D generation timed out');
        }

        await new Promise(r => setTimeout(r, 3000));

        const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
            headers: {
                'Authorization': `Token ${config.replicateApiKey}`,
                'Content-Type': 'application/json'
            },
        });

        if (!pollResponse.ok) {
            throw new Error('Failed to poll prediction status');
        }

        result = await pollResponse.json();
    }

    if (result.status === 'failed') {
        throw new Error(result.error || '3D generation failed');
    }

    // Replicate output for Shap-E is usually a URL to the mesh
    const meshUrl = Array.isArray(result.output) ? result.output[0] : result.output;

    if (!meshUrl) {
        throw new Error('No output mesh URL received');
    }

    return {
        meshUrl,
        format: config.format || 'glb',
        prompt: config.prompt,
    };
}

/**
 * Check if 3D generation is configured
 */
export function is3DConfigured(apiKey?: string): boolean {
    return !!apiKey;
}
