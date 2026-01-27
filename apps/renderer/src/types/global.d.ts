/// <reference types="vite/client" />
import { VwoApi } from "@vwo/shared-types";

declare global {
  interface Window {
    vwoApi: VwoApi;
  }
}

export { };
