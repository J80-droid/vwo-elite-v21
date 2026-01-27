/**
 * MockAIService
 * Simulates AI responses for deterministic testing of the multi-agent pipeline.
 */
export class MockAIService {
    private static responseQueue: string[] = [];
    private static history: string[] = [];

    /**
     * Queues a mock response for the next aiGenerate call.
     */
    static queueResponse(label: string, response: string | object) {
        console.log(`[MockAI] Queuing response for: ${label}`);
        const content = typeof response === 'string' ? response : JSON.stringify(response);
        this.responseQueue.push(content);
    }

    /**
     * Simulates aiGenerate
     */
    static async generate(prompt: string): Promise<string> {
        this.history.push(prompt);
        const response = this.responseQueue.shift();

        if (!response) {
            console.warn(`[MockAI] No response queued for prompt. Using generic fallback.`);
            return "Generic Mock Response (No response queued)";
        }

        return response;
    }

    static getHistory() { return this.history; }

    static reset() {
        this.responseQueue = [];
        this.history = [];
    }
}
