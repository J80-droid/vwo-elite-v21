import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { exec, spawn, execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

let splashWindow;
const TARGET_DIR = join(app.getPath('appData'), 'vwo-elite-v21');
const PAYLOAD_NAME = 'vwo-elite-payload.tar';

// Standardized Main App UserData
const MAIN_APP_USER_DATA = join(app.getPath('appData'), 'VWO Elite');

// --- SINGLE INSTANCE LOCK ---
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        if (splashWindow) {
            if (splashWindow.isMinimized()) splashWindow.restore();
            splashWindow.focus();
        }
    });
}

/**
 * Main Setup/Launch Entry Point
 */
function createSplash() {
    splashWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        center: true,
        show: false,
        fullscreen: true,
        backgroundColor: '#000000',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            backgroundThrottling: false,
        }
    });

    const splashFile = join(__dirname, '../public/splash_cinematic.html');
    splashWindow.loadFile(splashFile);

    // Fallback if video fails to signal ready
    const forcedCheck = setTimeout(() => {
        if (splashWindow && !splashWindow.isDestroyed() && !splashWindow.isVisible()) {
            console.log('[Launcher] Splash video timeout, forcing show.');
            splashWindow.show();
            checkAndInstall();
        }
    }, 5000);

    ipcMain.on('get-app-path', (event) => {
        event.returnValue = app.getAppPath();
    });

    ipcMain.once('splash:video-ready', () => {
        clearTimeout(forcedCheck);
        if (splashWindow && !splashWindow.isDestroyed()) {
            console.log('[Launcher] Video signals ready, showing window.');
            splashWindow.show();
            setTimeout(() => checkAndInstall(), 800);
        }
    });
}

/**
 * Validation and Decision Logic
 */
function checkAndInstall() {
    // Detect payload location (next to exe)
    const exeDir = process.env.PORTABLE_EXECUTABLE_DIR || dirname(process.execPath);
    const payloadPath = join(exeDir, PAYLOAD_NAME);

    const appExePath = join(TARGET_DIR, 'VWO Elite.exe');
    const localesPath = join(TARGET_DIR, 'locales'); // Essential for Electron launch
    const markerPath = join(TARGET_DIR, '.install_complete');

    // ✅ VALIDATION: Only skip extraction if all core parts exist and install was finished
    const isValidInstallation = existsSync(appExePath) &&
        existsSync(localesPath) &&
        existsSync(markerPath);

    if (isValidInstallation) {
        console.log('[Launcher] Existing installation verified. Booting...');
        splashWindow.webContents.send('installer:step', { type: 'launch', status: 'start', message: 'System healthy. Booting VWO Elite...' });
        splashWindow.webContents.send('installer:file', `[BOOT] Verifying components: OK`);

        setTimeout(() => {
            splashWindow.webContents.send('installer:step', { type: 'launch', status: 'complete', message: 'Kernel Uplink Established.' });
            setTimeout(() => launchApp(TARGET_DIR), 800);
        }, 1200);
        return;
    }

    // ❌ INSTALLATION BROKEN OR MISSING
    console.log('[Launcher] Installation missing or invalid. Initiating setup flow.');
    if (existsSync(payloadPath)) {
        // Step 1: Initialization UI
        splashWindow.webContents.send('installer:step', { type: 'init', status: 'start', message: 'Initializing setup sequence...' });
        splashWindow.webContents.send('installer:file', `Stream: ${PAYLOAD_NAME}`);

        setTimeout(() => {
            splashWindow.webContents.send('installer:step', { type: 'init', status: 'complete', message: 'Initialization complete' });
            splashWindow.webContents.send('installer:step', { type: 'extract', status: 'start', message: 'Syncing VWO Elite Matrix (1.5GB)...' });
            startExtraction(payloadPath);
        }, 1000);
    } else {
        // FATAL: Payload not found
        dialog.showErrorBox('Setup Error',
            `Required resource missing: ${PAYLOAD_NAME}\n\n` +
            `Please ensure this file is located in the same folder as the Setup program:\n${exeDir}`
        );
        app.quit();
    }
}

/**
 * Physical Extraction Logic
 */
function startExtraction(payloadPath) {
    const logPath = join(dirname(process.execPath), 'vwo-setup-debug.log');
    const log = (msg) => {
        const entry = `[${new Date().toISOString()}] ${msg}\n`;
        console.log(msg);
        try { writeFileSync(logPath, entry, { flag: 'a' }); } catch (e) { }
    };

    log('[Launcher] Extraction started');
    log(`[Launcher] Source: ${payloadPath}`);
    log(`[Launcher] Destination: ${TARGET_DIR}`);

    // Clean start: Kill processes and purge folder
    try {
        if (process.platform === 'win32') {
            execSync('taskkill /F /IM "VWO Elite.exe" /T /FI "STATUS eq RUNNING"', { stdio: 'ignore' });
        }
    } catch (e) { }

    try {
        if (existsSync(TARGET_DIR)) {
            log('[Launcher] Purging target directory for clean install...');
            execSync(`powershell -Command "Remove-Item -Recurse -Force '${TARGET_DIR}' -ErrorAction SilentlyContinue"`);
        }
        mkdirSync(TARGET_DIR, { recursive: true });
    } catch (e) {
        log(`[Launcher] Directory preparation warning: ${e.message}`);
    }

    // Extraction proper
    const tarArgs = ['-xf', payloadPath, '-C', TARGET_DIR];
    log(`[Launcher] Running tar ${tarArgs.join(' ')}`);

    const extractProcess = spawn('tar', tarArgs, {
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true
    });

    let dotCount = 0;
    const pulseInterval = setInterval(() => {
        dotCount = (dotCount + 1) % 4;
        splashWindow.webContents.send('installer:file', `Optimizing data packets${'.'.repeat(dotCount)}`);
    }, 800);

    const onData = (data) => {
        const text = data.toString().trim();
        if (text) {
            log(`[Tar Output] ${text}`);
            if (splashWindow && !splashWindow.isDestroyed()) {
                splashWindow.webContents.send('installer:file', text);
            }
        }
    };

    extractProcess.stdout.on('data', onData);
    extractProcess.stderr.on('data', onData);

    extractProcess.on('error', (err) => {
        log(`[Launcher] TAR SPAWN ERROR: ${err.message}`);
        clearInterval(pulseInterval);
        dialog.showErrorBox('Extraction Failed', `Internal system error starting 'tar': ${err.message}`);
        app.quit();
    });

    extractProcess.on('close', (code) => {
        clearInterval(pulseInterval);
        log(`[Launcher] Extraction complete. Exit code: ${code}`);

        if (code !== 0) {
            log('[Launcher] CRITICAL: Extraction was not successful.');
            splashWindow.webContents.send('installer:step', { type: 'error', status: 'error', message: `Extraction failed (Error ${code})` });
            dialog.showErrorBox('Installation Error', `The system utility 'tar' failed (Code ${code}). Your payload might be corrupted.`);
            app.quit();
        } else {
            // Verify extraction actually put something there (especially locales)
            if (existsSync(join(TARGET_DIR, 'locales'))) {
                log('[Launcher] Post-extraction verification: SUCCESS');
                try { writeFileSync(join(TARGET_DIR, '.install_complete'), `Installed at ${new Date().toISOString()}`); } catch (e) { }
                splashWindow.webContents.send('installer:step', { type: 'extract', status: 'complete', message: 'Synchronization complete' });
                setTimeout(() => launchApp(TARGET_DIR), 1500);
            } else {
                log('[Launcher] Post-extraction verification: FAILED (Locales missing)');
                dialog.showErrorBox('Installation Error', 'Extraction appeared successful but critical files are missing. Please ensure you have enough disk space and no antivirus is blocking the installer.');
                app.quit();
            }
        }
    });
}

/**
 * Hand-off to Main Application
 */
function launchApp(installDir) {
    const appExe = join(installDir, 'VWO Elite.exe');

    try {
        if (!existsSync(MAIN_APP_USER_DATA)) mkdirSync(MAIN_APP_USER_DATA, { recursive: true });
        writeFileSync(join(MAIN_APP_USER_DATA, '.v8_instant_marker'), 'CINEMATIC_DONE_BY_LAUNCHER_V21_3');
    } catch (e) { }

    log(`[Launcher] Launching: ${appExe}`);

    const child = spawn(appExe, [], {
        cwd: installDir,
        detached: true,
        stdio: 'ignore'
    });

    child.unref();

    // Fade out / Close
    setTimeout(() => {
        if (splashWindow && !splashWindow.isDestroyed()) splashWindow.close();
        app.quit();
    }, 10000);
}

// Ensure first call to log
const log = (msg) => {
    const entry = `[${new Date().toISOString()}] ${msg}\n`;
    const logPath = join(dirname(process.execPath), 'vwo-setup-debug.log');
    try { writeFileSync(logPath, entry, { flag: 'a' }); } catch (e) { }
};

app.whenReady().then(createSplash);
