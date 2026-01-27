import { CustomProvider } from "./CustomProvider";
import { GeminiProvider } from "./GeminiProvider";
import { GroqProvider } from "./GroqProvider";
import { HuggingFaceProvider } from "./HuggingFaceProvider";
import { AIProvider, PROVIDER_ID } from "./types";

export class ProviderRegistry {
    private static instance: ProviderRegistry;
    private providers: Map<PROVIDER_ID, AIProvider> = new Map();

    private constructor() {
        // Register static primary providers
        this.register(new GeminiProvider());
        this.register(new GroqProvider());
        this.register(new HuggingFaceProvider());
    }

    static getInstance(): ProviderRegistry {
        if (!ProviderRegistry.instance) {
            ProviderRegistry.instance = new ProviderRegistry();
        }
        return ProviderRegistry.instance;
    }

    /**
     * Register a new provider instance
     */
    register(provider: AIProvider): void {
        this.providers.set(provider.id, provider);
    }

    /**
     * Get a provider by ID, or create a dynamic one for custom/local endpoints
     */
    get(id: PROVIDER_ID): AIProvider {
        // Return existing if registered
        if (this.providers.has(id)) {
            return this.providers.get(id)!;
        }

        // Dynamic creation for custom or local providers
        if (id.startsWith("custom:") || ["ollama", "lmstudio", "jan", "local"].includes(id.toLowerCase())) {
            const custom = new CustomProvider(id);
            this.register(custom);
            return custom;
        }

        throw new Error(`Provider ${id} is not registered and cannot be created dynamically.`);
    }

    /**
     * Get all registered providers
     */
    getAll(): AIProvider[] {
        return Array.from(this.providers.values());
    }
}
