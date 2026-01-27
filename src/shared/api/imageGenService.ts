/**
 * Image Generation Service
 * Generates educational illustrations and diagrams using OpenAI DALL-E 3
 * Part of the 1250% Elite Intelligence Upgrade
 */

export interface ImageGenConfig {
    apiKey: string;
    model?: "dall-e-3" | "dall-e-2";
    size?: "1024x1024" | "1024x1792" | "1792x1024";
    quality?: "standard" | "hd";
    style?: "vivid" | "natural";
}

export interface ImageGenResult {
    url: string;
    revisedPrompt?: string;
}

/**
 * Generate an image based on a prompt
 */
export async function generateImage(
    prompt: string,
    config: ImageGenConfig
): Promise<ImageGenResult> {
    if (!config.apiKey) {
        throw new Error("OpenAI API key is required for Image Generation");
    }

    // Enhance prompt for educational clarity if it's for VWO
    const enhancedPrompt = `Educational illustration for high school (VWO) level: ${prompt}. 
    Ensure scientific accuracy, clear labeling if applicable, and a professional, modern aesthetic. 
    No text unless requested.`;

    const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
            model: config.model || "dall-e-3",
            prompt: enhancedPrompt,
            n: 1,
            size: config.size || "1024x1024",
            quality: config.quality || "standard",
            style: config.style || "natural",
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "Image generation failed");
    }

    const result = await response.json();

    return {
        url: result.data[0].url,
        revisedPrompt: result.data[0].revised_prompt
    };
}

/**
 * Check if Image Generation is configured
 */
export function isImageGenConfigured(apiKey?: string): boolean {
    return !!apiKey && apiKey.startsWith("sk-");
}
