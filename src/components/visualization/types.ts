/**
 * Types for visualization components
 *
 * IMPORTANT: This file exists to break the import chain between
 * MathLabContext and the heavy 3D visualizers. By keeping types
 * in a separate file, we prevent the entire SurfacePlotter/GraphPlotter
 * modules from being pulled into the main bundle.
 */

// Handle for SurfacePlotter component ref
export interface SurfacePlotterHandle {
  toggleVR: () => Promise<void>;
  toggleAR: () => Promise<void>;
  capture: () => Promise<string>;
}

// Handle for GraphPlotter component ref
export interface GraphPlotterHandle {
  toggleSettings: () => void;
  resetView: () => void;
  capturePng?: () => Promise<string>;
  captureWithGamma?: (gamma: number) => Promise<string>;
}
