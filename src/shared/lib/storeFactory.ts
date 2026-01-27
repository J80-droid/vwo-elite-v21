import { create, StateCreator } from "zustand";
import { devtools, persist, PersistOptions } from "zustand/middleware";

/**
 * Standardized Store Factory
 *
 * Provides a consistent way to create Zustand stores with:
 * 1. Persistence (localStorage by default)
 * 2. DevTools integration
 * 3. Optional Sanitization middleware
 */

export interface StoreOptions<T, P = T> {
    name: string;
    persist?: boolean;
    persistOptions?: Partial<PersistOptions<T, P>>;
    sanitize?: (state: T) => T;
}

export function createStore<T extends object, P = T>(
    initializer: StateCreator<T, [["zustand/devtools", never], ["zustand/persist", unknown]], []>,
    options: StoreOptions<T, P>
) {
    const { name, persist: shouldPersist = true, sanitize } = options;

    let creator = initializer;

    // Add Sanitization Middleware if provided
    if (sanitize) {
        const originalInitializer = creator;
        creator = (set, get, api) => {
            const sanitizedSet: typeof set = (partial, replace) => {
                // Handle both overloads of 'set'
                if (replace) {
                    set((state) => {
                        const nextState =
                            typeof partial === "function"
                                ? (partial as (state: T) => T)(state)
                                : (partial as T);
                        return sanitize(nextState);
                    }, true);
                } else {
                    set((state) => {
                        const nextState =
                            typeof partial === "function"
                                ? (partial as (state: T) => Partial<T>)(state)
                                : (partial as Partial<T>);
                        return sanitize({ ...state, ...nextState });
                    }, false);
                }
            };
            return originalInitializer(sanitizedSet, get, api);
        };
    }

    // Wrap with middlewares
    const withDevtools = devtools(creator as unknown as StateCreator<T>, { name });

    if (shouldPersist) {
        const withPersist = persist(withDevtools as unknown as StateCreator<T>, {
            name: `vwo-elite-${name}`,
            ...options.persistOptions,
        });
        return create<T>()(withPersist as unknown as StateCreator<T>);
    }

    return create<T>()(withDevtools as unknown as StateCreator<T>);
}
