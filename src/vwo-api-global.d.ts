import type { VwoApi } from "@vwo/shared-types";

declare global {
  interface Window {
    vwoApi?: VwoApi;
  }
}
