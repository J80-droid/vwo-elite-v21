import { app, BrowserWindow, ipcMain, session } from "electron";
import { existsSync, writeFileSync } from "fs";
import { join } from "path";

import { getDreamingAgent } from "./ai-brain/dreamingAgent";
import { getOrchestrator } from "./ai-brain/orchestrator";
import { initMainDb } from "./db/sqlite";
import { registerIpcHandlers } from "./ipc-handlers";
import { DocumentRepository } from "./repositories/document.repository";
import { safeLog } from "./utils/safe-logger";

performance.mark("app-start");

// 🛡️ ELITE SECURITY: Global CSP Enforcement
function setupSecurity(): void {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const isDev = !app.isPackaged;
    // 🛡️ ELITE SCRUBBING: Remove any existing CSP headers (from Vite/DevServer) for absolute enforcement
    const headers = { ...details.responseHeaders };
    Object.keys(headers).forEach(k => {
      if (k.toLowerCase() === 'content-security-policy') delete headers[k];
    });

    // In Dev, we need 'unsafe-eval' for Vite/HMR. 
    // We add blob: to script-src to allow blob workers when worker-src is not fully supported or falls back.
    const scriptSrc = isDev
      ? "'self' 'unsafe-inline' 'unsafe-eval' blob:"
      : "'self' 'unsafe-inline'";

    callback({
      responseHeaders: {
        ...headers,
        "Content-Security-Policy": [
          `default-src 'self'; script-src ${scriptSrc}; worker-src 'self' blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' https: http://localhost:3001 http://localhost:11434; media-src 'self' data: blob:; frame-src 'self' https://embed.windy.com; object-src 'none';`
        ]
      }
    });
  });
}

// 🛡️ ABSOLUTE ZERO STABILITY FIX: Complete stream & console silencing
if (app.isPackaged) {
  // 1. Silence Console Object
  const noop = () => { };
  console.log = noop;
  console.warn = noop;
  console.error = noop;
  console.time = noop;
  console.timeEnd = noop;

  // 2. Silence process streams (The root of EPIPE)
  process.stdout.write = () => true;
  process.stderr.write = () => true;
}

// ✅ GLOBAL EPIPE SHIELD (Secondary Layer)
process.on("uncaughtException", (err: Error) => {
  if ((err as { code?: string }).code === "EPIPE") return;
  safeLog.error("[Main] Uncaught Exception:", err);
});


// --- 1. SKELETON CONFIG ---
const V8_MARKER = join(app.getPath("userData"), ".v8_instant_marker");
const isFirstRun = !existsSync(V8_MARKER);

const resolveResource = (...paths: string[]) => {
  if (app.isPackaged) {
    return join(process.resourcesPath, ...paths);
  }
  return join(__dirname, "../../public", ...paths);
};

let splash: BrowserWindow | null = null;
let mainWindow: BrowserWindow | null = null;

let splashStartTime = Date.now();

// --- 2. INSTANT CINEMATIC ENGINE ---
function createSplash(): void {
  splash = new BrowserWindow({
    width: 600,
    height: 400,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    center: true,
    show: false, // READY-TO-SHOW PATTERN
    fullscreen: isFirstRun, // Cinematic is always fullscreen
    backgroundColor: "#000000",
    icon: resolveResource("favicon.ico"),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // Simpler for splash communication
      backgroundThrottling: false,
    },
  });

  const splashFile = isFirstRun ? "splash_cinematic.html" : "splash.html";
  splash.loadFile(resolveResource(splashFile));

  ipcMain.once("splash:video-ready", () => {
    if (splash && !splash.isDestroyed()) {
      splash.show();
      splashStartTime = Date.now();
      safeLog.log("[Main] Splash is visible and playing.");
    }
  });
}

// --- 3. THE BOOTSTRAP (STRUCTURAL) ---
async function bootstrap() {
  safeLog.log("[Main] Starting Bootstrap...");

  try {
    // 1. Services & Data (Synchronous logic)
    initMainDb();
    new DocumentRepository().verifyIntegrity().catch(safeLog.error);

    getOrchestrator();
    getDreamingAgent();

    // 2. Handlers (REGISTER BEFORE WINDOW CREATION)
    ipcMain.handle("sys:get-resources-path", () => {
      return app.isPackaged ? process.resourcesPath : join(__dirname, "../../public");
    });

    registerIpcHandlers();
    safeLog.log("[Main] IPC Handlers registered successfully.");

    // 3. App Window (LAUNCH AFTER HANDLERS ARE READY)
    createWindow();

    // 4. Mark initialization complete
    if (isFirstRun) {
      writeFileSync(V8_MARKER, "GOLDEN");
    }

    safeLog.log("[Main] VWO Elite Architecture ready.");
    performance.mark("app-bootstrap-done");
  } catch (error) {
    safeLog.error("[Main] FATAL: Error during bootstrap:", error);
    throw error;
  }
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    backgroundColor: "#020617",
    center: true,
    frame: false,
    autoHideMenuBar: true,
    icon: resolveResource("favicon.ico"),
    webPreferences: {
      preload: join(__dirname, "../preload/index.mjs"),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.on("ready-to-show", () => {
    const MIN_DURATION = isFirstRun ? 8000 : 0;
    const elapsedTime = Date.now() - splashStartTime;
    const remainingTime = Math.max(0, MIN_DURATION - elapsedTime);

    safeLog.log(`[Main] Splash active for ${elapsedTime}ms. Remaining: ${remainingTime}ms`);

    setTimeout(() => {
      if (splash && !splash.isDestroyed()) {
        splash.destroy();
        splash = null;
      }
      if (mainWindow) {
        mainWindow.maximize();
        mainWindow.show();
        mainWindow.focus();
        performance.measure("main-window-visible", "app-start");
      }
    }, remainingTime);
  });

  const rendererUrl = process.env.ELECTRON_RENDERER_URL;
  if (rendererUrl) {
    mainWindow.loadURL(rendererUrl);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

// --- 4. THE ENTRY POINT ---
const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    performance.mark("app-ready");
    // In production, the Launcher handles the cinematic splash.
    // We only show an internal splash during development.
    if (!app.isPackaged) {
      createSplash();
    }

    setupSecurity();
    bootstrap().catch((err) => {
      safeLog.error("[Main] Critical bootstrap failure:", err);
    });
  });
}

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0 && app.isReady()) {
    createWindow();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

