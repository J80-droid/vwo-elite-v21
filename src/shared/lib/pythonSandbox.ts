/**
 * Python Sandbox Service (VWO Elite)
 * Proxy for the Python Web Worker.
 */

import { logger } from "./logger";

export interface PythonExecutionResult {
    output: string;
    result: unknown;
    images: string[];
    error?: string;
}

class PythonSandbox {
    private worker: Worker | null = null;
    private pendingResolves = new Map<string, (res: PythonExecutionResult) => void>();

    /**
     * Lazy-start the worker
     */
    private getWorker(): Worker {
        if (!this.worker) {
            // In Vite, we use ?worker to treat it as a worker
            this.worker = new Worker(new URL("./python.worker.ts", import.meta.url), {
                type: "module",
            });

            this.worker.onmessage = (event) => {
                const { id, success, results, error } = event.data;
                const resolve = this.pendingResolves.get(id);
                if (resolve) {
                    if (success) {
                        resolve(results);
                    } else {
                        resolve({ error, output: "", result: null, images: [] });
                    }
                    this.pendingResolves.delete(id);
                }
            };

            this.worker.onerror = (err) => {
                logger.error("[PythonSandbox] Worker Fatal Error:", err);
                // Restart on crash?
                this.worker?.terminate();
                this.worker = null;
            };
        }
        return this.worker;
    }

    /**
     * Execute Python code in the sandbox
     */
    async execute(code: string): Promise<PythonExecutionResult> {
        const id = crypto.randomUUID();
        const worker = this.getWorker();

        return new Promise((resolve) => {
            this.pendingResolves.set(id, resolve);
            worker.postMessage({ id, code });

            // ELITE PROTECTION: Systeem-level timeout (30s)
            setTimeout(() => {
                const pending = this.pendingResolves.get(id);
                if (pending) {
                    this.worker?.terminate();
                    this.worker = null; // Re-init on next call
                    resolve({
                        error: "Execution Timeout: Python code took too long to run (Infinite loop protection).",
                        output: "Timeout triggered.",
                        result: null,
                        images: []
                    });
                    this.pendingResolves.delete(id);
                }
            }, 30000);
        });
    }

    /**
     * Terminate the sandbox to free resources
     */
    terminate(): void {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
    }
}

export const pythonSandbox = new PythonSandbox();
