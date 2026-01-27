import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

async function findInFiles(dir, regex) {
    const results = [];
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== 'out') {
            const subResults = await findInFiles(fullPath, regex);
            results.push(...subResults);
        } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') || entry.name.endsWith('.js'))) {
            let content = await readFile(fullPath, 'utf8');
            // Strip single line comments
            content = content.replace(/\/\/.*$/gm, '');
            // Strip multi-line comments
            content = content.replace(/\/\*[\s\S]*?\*\//g, '');

            let match;
            while ((match = regex.exec(content)) !== null) {
                results.push({ value: match[1], path: fullPath });
            }
        }
    }
    return results;
}

// Regex to catch both IpcChannels.ENUM and "string-literal"
const mainHandleRegex = /ipcMain\.handle\s*\(\s*(?:IpcChannels\.)?(['"]?[\w:]+['"]?)/g;
const mainSendRegex = /(?:win|webContents|event\.sender)\.send\s*\(\s*(?:IpcChannels\.)?(['"]?[\w:]+['"]?)/g;
const rendererInvokeRegex = /(?:ipcRenderer|window\.vwoApi|vwoApi|api)\.invoke\s*\(\s*(?:IpcChannels\.)?(['"]?[\w:]+['"]?)/g;
const rendererOnRegex = /(?:ipcRenderer|window\.vwoApi|vwoApi|api)\.(?:on|listen)\s*\(\s*(?:IpcChannels\.)?(['"]?[\w:]+['"]?)/g;

async function getIpcEnumMap() {
    const content = await readFile('packages/shared-types/src/ipc.ts', 'utf8');
    const enumMap = new Map();
    const enumRegex = /(\w+)\s*=\s*["']([\w:-]+)["']/g;
    let match;
    while ((match = enumRegex.exec(content)) !== null) {
        enumMap.set(match[1], match[2]);
    }
    return enumMap;
}

const enumMap = await getIpcEnumMap();
const normalize = (s) => {
    const val = s.replace(/['"]/g, '');
    return enumMap.get(val) || val;
};

console.log('[ELITE IPC AUDIT] Checking for Ghost Channels...');

const mainHandles = await findInFiles('apps/main', mainHandleRegex);
const mainSends = await findInFiles('apps/main', mainSendRegex);
const rendererInvokes = [];
const rendererOns = [];
const rendererPaths = ['apps/preload', 'src'];
for (const path of rendererPaths) {
    rendererInvokes.push(...await findInFiles(path, rendererInvokeRegex));
    rendererOns.push(...await findInFiles(path, rendererOnRegex));
}

const mainHandleSet = new Set(mainHandles.map(m => normalize(m.value)));
const mainSendSet = new Set(mainSends.map(m => normalize(m.value)));

const rendererInvokeMap = new Map();
for (const r of rendererInvokes) {
    const norm = normalize(r.value);
    if (!rendererInvokeMap.has(norm)) rendererInvokeMap.set(norm, []);
    rendererInvokeMap.get(norm).push(r.path);
}

const rendererOnMap = new Map();
for (const r of rendererOns) {
    const norm = normalize(r.value);
    if (!rendererOnMap.has(norm)) rendererOnMap.set(norm, []);
    rendererOnMap.get(norm).push(r.path);
}

let ghostFound = false;

// 1. Check Invokes (Renderer -> Main)
for (const [chan, paths] of rendererInvokeMap.entries()) {
    if (chan === 'channel' || chan === 'chan' || !chan || chan.length < 3) continue;
    if (!mainHandleSet.has(chan)) {
        console.error(`[GHOST INVOKE] Renderer invokes "${chan}" in ${paths[0]}, but Main has no handler!`);
        ghostFound = true;
    }
}

// 2. Check Events (Main -> Renderer)
for (const [chan, paths] of rendererOnMap.entries()) {
    if (chan === 'channel' || chan === 'chan' || !chan || chan.length < 3) continue;
    if (!mainSendSet.has(chan)) {
        console.warn(`[UNDOCUMENTED EVENT] Renderer listens to "${chan}" in ${paths[0]}, but Main never sends it.`);
    }
}

// 3. Unused Handlers
for (const chan of mainHandleSet) {
    if (chan === 'channel' || chan === 'chan' || !chan || chan.length < 3) continue;
    if (!rendererInvokeMap.has(chan)) {
        console.warn(`[UNUSED HANDLE] Main handles "${chan}", but Renderer never invokes it.`);
    }
}

if (ghostFound) {
    console.error('\n[ELITE IPC AUDIT] FAILED: Ghost channels detected.');
    process.exitCode = 1;
} else {
    console.log('\n[ELITE IPC AUDIT] PASSED: All IPC channels are aligned.');
}
