/* eslint-disable @typescript-eslint/no-explicit-any -- Pyodide is a CDN-loaded dynamic library with complex types */

// Basic type definitions for Pyodide
declare global {
  interface Window {
    loadPyodide: (config: Record<string, unknown>) => Promise<unknown>;
    pyodide: unknown;
  }
}

export interface PythonVariable {
  name: string;
  type: string;
  value: string;
  shape?: string;
}

export interface PythonResult {
  output: string;
  error?: string;
  plots?: string[];
  variables?: PythonVariable[];
}

const EXECUTION_TIMEOUT_MS = 8000; // 8 seconds

class PythonService {
  private pyodide: any = null;
  private isLoading = false;

  async init() {
    if (this.pyodide || this.isLoading) return;
    this.isLoading = true;

    try {
      // Load Pyodide script dynamically
      if (!window.loadPyodide) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src =
            "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js";
          script.onload = () => {
            if (typeof window.loadPyodide === "function") {
              resolve();
            } else {
              let attempts = 0;
              const checkInterval = setInterval(() => {
                attempts++;
                if (typeof window.loadPyodide === "function") {
                  clearInterval(checkInterval);
                  resolve();
                } else if (attempts > 100) {
                  clearInterval(checkInterval);
                  reject(
                    new Error(
                      `Pyodide loaded but loadPyodide not found after 10s.`,
                    ),
                  );
                }
              }, 100);
            }
          };
          script.onerror = () =>
            reject(new Error("Failed to load Pyodide script"));
          document.head.appendChild(script);
        });
      }

      if (typeof window.loadPyodide !== "function") {
        throw new Error("window.loadPyodide is not defined after script load.");
      }

      this.pyodide = await window.loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/",
      });

      // Pre-load essential packages for VWO
      await this.pyodide.loadPackage([
        "numpy",
        "pandas",
        "matplotlib",
        "scipy",
      ]);

      // Setup custom functions: input(), plt.show(), and dark theme
      this.pyodide.runPython(`
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import io
import base64
import sys
import builtins

# Set Dark Background style for VWO Elite
plt.style.use('dark_background')
plt.rcParams['figure.facecolor'] = '#0d1117'
plt.rcParams['axes.facecolor'] = '#161b22'
plt.rcParams['savefig.facecolor'] = '#0d1117'
plt.rcParams['figure.dpi'] = 100

# Custom show() to capture plots
def custom_show():
    buf = io.BytesIO()
    plt.savefig(buf, format='png', bbox_inches='tight', pad_inches=0.2)
    buf.seek(0)
    img_str = base64.b64encode(buf.read()).decode('utf-8')
    print(f"__PLOT__:{img_str}")
    plt.clf()
    plt.close('all')

plt.show = custom_show

# Custom input() that signals the UI to show a prompt
# This uses a special marker that the JS code will intercept
_pending_inputs = []

def custom_input(prompt_text=""):
    # Print a special marker for the JS to intercept
    print(f"__INPUT_REQUEST__:{prompt_text}")
    # In real Web Worker implementation, this would block and wait
    # For now, we return a warning message
    return "[input() is niet beschikbaar in de browser. Gebruik variabelen in je code.]"

builtins.input = custom_input
            `);

      console.log(
        "[PythonService] Engine Ready with numpy, pandas, matplotlib, scipy",
      );
    } catch (err) {
      console.error("[PythonService] Failed to initialize:", err);
    } finally {
      this.isLoading = false;
    }
  }

  async run(code: string): Promise<PythonResult> {
    if (!this.pyodide) throw new Error("Python environment not initialized");

    // Create a timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(
          new Error(
            `⏱️ Code geannuleerd: Timeout na ${EXECUTION_TIMEOUT_MS / 1000} seconden.\nTip: Controleer op oneindige loops (while True, for x in range(999999999), etc.)`,
          ),
        );
      }, EXECUTION_TIMEOUT_MS);
    });

    try {
      // Race between execution and timeout
      const result = await Promise.race([
        this._executeCode(code),
        timeoutPromise,
      ]);
      return result;
    } catch (err: any) {
      return {
        output: "",
        error: err.toString(),
      };
    }
  }

  private async _executeCode(code: string): Promise<PythonResult> {
    // Clear matplotlib state to prevent ghost plots
    this.pyodide.runPython(`
import matplotlib.pyplot as plt
plt.clf()
plt.close('all')
`);

    // Reset output capture
    this.pyodide.runPython(`
import sys
import io
sys.stdout = io.StringIO()
sys.stderr = sys.stdout
`);

    // Load any missing packages from imports (with error handling)
    try {
      await this.pyodide.loadPackagesFromImports(code);
    } catch (pkgErr: any) {
      // Package loading failed - provide helpful message
      const match = pkgErr.message?.match(/No module named '([^']+)'/);
      const pkgName = match?.[1] || "onbekend";
      return {
        output: "",
        error: `📦 Package Error: '${pkgName}' is niet beschikbaar.\n\nBeschikbare packages: numpy, pandas, matplotlib, scipy, math, random\n\nTip: Sommige Python packages werken niet in de browser.`,
      };
    }

    // Run the user code
    await this.pyodide.runPythonAsync(code);

    // Get standard output
    const stdout = this.pyodide.runPython("sys.stdout.getvalue()");

    // Parse for special markers (plots, input requests)
    const lines = stdout.split("\n");
    const cleanOutput: string[] = [];
    const plots: string[] = [];
    // let hasInputRequest = false;

    lines.forEach((line: string) => {
      if (line.startsWith("__PLOT__:")) {
        plots.push(line.replace("__PLOT__:", ""));
      } else if (line.startsWith("__INPUT_REQUEST__:")) {
        // hasInputRequest = true;
        const prompt = line.replace("__INPUT_REQUEST__:", "");
        cleanOutput.push(`⚠️ input("${prompt}") werd aangeroepen.`);
        cleanOutput.push(
          `   → In de browser kun je geen keyboard input gebruiken.`,
        );
        cleanOutput.push(
          `   → Definieer de waarde direct in je code, bijv: naam = "Jan"`,
        );
      } else {
        cleanOutput.push(line);
      }
    });

    // Inspect variables
    const variables = await this.inspectVariables();

    return {
      output: cleanOutput.join("\n"),
      plots,
      variables,
    };
  }

  async inspectVariables(): Promise<PythonVariable[]> {
    if (!this.pyodide) return [];

    try {
      const inspectorCode = `
import json
import pandas as pd
import numpy as np

def _inspect_vars():
    result = []
    # Ignore system/internal variables
    ignore = {
        '__name__', '__doc__', '__package__', '__loader__', '__spec__', 
        '__annotations__', '__builtins__', '_inspect_vars', 'json', 
        'pd', 'np', 'plt', 'matplotlib', 'io', 'base64', 'sys', 
        'custom_show', 'scipy'
    }
    
    for name, value in globals().items():
        if name in ignore or name.startswith('_'):
            continue
        
        type_name = type(value).__name__
        shape_str = None
        
        # Special handling for different types
        if isinstance(value, pd.DataFrame):
            val_str = f"DataFrame: {value.shape[0]} rows × {value.shape[1]} cols"
            shape_str = f"Columns: {', '.join(value.columns[:5])}{'...' if len(value.columns) > 5 else ''}"
        elif isinstance(value, pd.Series):
            val_str = f"Series: {len(value)} items"
            shape_str = f"dtype: {value.dtype}"
        elif isinstance(value, np.ndarray):
            val_str = f"Array: shape {value.shape}"
            shape_str = f"dtype: {value.dtype}"
        elif isinstance(value, (list, tuple)):
            if len(value) > 5:
                val_str = f"{type_name}[{len(value)}]: {str(value[:3])}..."
            else:
                val_str = str(value)
        elif isinstance(value, dict):
            keys = list(value.keys())[:3]
            val_str = f"dict[{len(value)} keys]: {{{', '.join(map(str, keys))}, ...}}" if len(value) > 3 else str(value)
        elif callable(value):
            continue  # Skip functions
        else:
            val_str = str(value)
            if len(val_str) > 100:
                val_str = val_str[:100] + "..."
        
        result.append({
            "name": name,
            "type": type_name,
            "value": val_str,
            "shape": shape_str
        })
    
    return json.dumps(result)

_inspect_vars()
`;
      const jsonStr = await this.pyodide.runPythonAsync(inspectorCode);
      return JSON.parse(jsonStr);
    } catch (e) {
      console.warn("[PythonService] Variable inspection failed:", e);
      return [];
    }
  }

  async writeFile(filename: string, content: string | Uint8Array) {
    if (!this.pyodide) throw new Error("Python environment not initialized");
    this.pyodide.FS.writeFile(filename, content);
    return filename;
  }

  listFiles(): string[] {
    if (!this.pyodide) return [];
    try {
      const files = this.pyodide.FS.readdir("/");
      return files.filter(
        (f: string) =>
          !f.startsWith(".") &&
          f !== "tmp" &&
          f !== "home" &&
          f !== "dev" &&
          f !== "proc" &&
          f !== "lib",
      );
    } catch {
      return [];
    }
  }
}

export const pythonService = new PythonService();
