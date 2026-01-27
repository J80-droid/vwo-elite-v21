import "@app/styles/index.css";
// KaTeX CSS moved to lazy loading in MathRenderer to avoid render-blocking
import "@shared/styles/app.css";
import "@shared/lib/i18n"; // Initialize i18next

console.log("[Renderer] Initializing...");
performance.mark("renderer-init");

import { AppProviders } from "@app/providers/AppProviders";
import { router } from "@app/router/router";
import React from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

// Remove HTML loading skeleton with fade-out transition
const appLoader = document.getElementById("app-loader");
if (appLoader) {
  appLoader.style.opacity = "0";
  setTimeout(() => appLoader.remove(), 300);
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AppProviders>
      <Toaster position="top-center" theme="dark" richColors />
      <RouterProvider router={router} />
    </AppProviders>
  </React.StrictMode>,
);

performance.mark("app-mount");
performance.measure("renderer-boot-to-mount", "renderer-init", "app-mount");
