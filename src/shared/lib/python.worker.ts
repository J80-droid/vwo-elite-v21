/**
 * Python Web Worker (VWO Elite)
 * Executes Python code in an isolated thread via Pyodide.
 */

/* eslint-disable no-restricted-globals */
// We use a CDN for Pyodide to keep the bundle size small
const PYODIDE_INDEX_URL = "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/";
importScripts(`${PYODIDE_INDEX_URL}pyodide.js`);

let pyodide: any = null;

async function initPyodide() {
    if (pyodide) return pyodide;

    // @ts-ignore - loadPyodide is available from the script above
    pyodide = await loadPyodide({
        indexURL: PYODIDE_INDEX_URL,
    });

    // Load foundational data science stack
    await pyodide.loadPackage(["numpy", "matplotlib", "pandas", "micropip"]);

    // Elite Plotting Shim
    await pyodide.runPythonAsync(`
import matplotlib.pyplot as plt
import io
import base64
import sys

def get_plot_base64():
    if len(plt.get_fignums()) == 0:
        return None
    buf = io.BytesIO()
    plt.savefig(buf, format='png', bbox_inches='tight')
    buf.seek(0)
    img_str = base64.b64encode(buf.read()).decode('utf-8')
    plt.clf()
    return img_str
`);

    return pyodide;
}

self.onmessage = async (event: MessageEvent) => {
    const { id, code } = event.data;

    try {
        const instance = await initPyodide();

        // Capture Stdout
        const stdout: string[] = [];
        instance.setStdout({
            batched: (msg: string) => stdout.push(msg)
        });

        // Clear previous state for a fresh execution
        await instance.runPythonAsync("plt.clf()");

        // 🚀 Execute!
        const result = await instance.runPythonAsync(code);

        // 📊 Check for plots
        const plotB64 = await instance.runPythonAsync("get_plot_base64()");
        const images = plotB64 ? [`data:image/png;base64,${plotB64}`] : [];

        self.postMessage({
            id,
            success: true,
            results: {
                output: stdout.join("\n"),
                result: result?.toString() || "",
                images
            }
        });
    } catch (error: any) {
        self.postMessage({
            id,
            success: false,
            error: error.message || String(error)
        });
    }
};
