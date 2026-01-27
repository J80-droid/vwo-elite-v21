import { useEffect, useState } from "react";

export function useEngineState<T>(key: string, initialState: T): [T, (value: T | ((val: T) => T)) => void] {
    const storageKey = `vwo-elite-engine-${key}`;

    // Initialize state from local storage or default
    const [state, setState] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(storageKey);
            return item ? JSON.parse(item) : initialState;
        } catch (error) {
            console.warn(`Error reading localStorage key "${storageKey}":`, error);
            return initialState;
        }
    });

    // Update local storage when state changes
    useEffect(() => {
        try {
            window.localStorage.setItem(storageKey, JSON.stringify(state));
        } catch (error) {
            console.warn(`Error writing localStorage key "${storageKey}":`, error);
        }
    }, [storageKey, state]);

    return [state, setState];
}
