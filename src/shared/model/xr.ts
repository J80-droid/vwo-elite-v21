/* eslint-disable @typescript-eslint/no-explicit-any -- dynamic Three.js and XR types */
/**
 * XR Store - Lazy Loaded
 *
 * IMPORTANT: This file uses dynamic imports to avoid pulling Three.js
 * into the main bundle. The XR store is only created when actually needed.
 */

// No top-level imports from @react-three/xr!
// This prevents Three.js from being bundled into the main chunk.

let store: any = null;

let createXRStoreFn: any = null;

/**
 * Lazily load the XR store creator function
 */
const loadXRModule = async () => {
  if (!createXRStoreFn) {
    const module = await import("@react-three/xr");
    createXRStoreFn = module.createXRStore;
  }
  return createXRStoreFn;
};

/**
 * Get or create the XR store (async)
 * Use this in components that need XR functionality
 */
export const getXrStoreAsync = async () => {
  if (!store) {
    const createXRStore = await loadXRModule();
    store = createXRStore();
  }
  return store;
};

/**
 * Synchronous getter for the XR store
 * IMPORTANT: Only use this AFTER getXrStoreAsync has been called!
 * This is for compatibility with existing code.
 */
export const getXrStore = () => {
  if (!store) {
    console.warn(
      "[XR Store] Store not initialized. Call getXrStoreAsync first.",
    );
    return null;
  }
  return store;
};

/**
 * Hook for using XR store (async-safe)
 * Will lazily initialize the store on first use
 */

export const useXRStore = (...args: any[]) => {
  if (!store) {
    console.warn(
      "[XR Store] Store not initialized. Use useXRStoreAsync for lazy loading.",
    );
    return null;
  }
  return store(...args);
};
