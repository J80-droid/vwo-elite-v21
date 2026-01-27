import { execSync } from 'child_process';
import { join } from 'path';
import fs from 'fs';

const root = process.cwd();
const dist = join(root, 'dist/electron');
const launcherPath = join(root, 'apps/launcher');

console.log('--- VWO ELITE v16.0 BUILD START ---');

// 1. Build Main App
console.log('[1/4] Building Main App...');
execSync('pnpm run build', { stdio: 'inherit' });
execSync('npx electron-builder build --win dir --publish never', { stdio: 'inherit' });

// 2. Package Payload
console.log('[2/4] Packaging Payload...');
const unpackedDir = join(dist, 'win-unpacked');
const payloadZip = join(dist, 'vwo-elite-payload.zip');
// Use PowerShell to zip for standard compatibility
execSync(`powershell -Command "Compress-Archive -Path '${unpackedDir}/*' -DestinationPath '${payloadZip}' -Force"`, { stdio: 'inherit' });

// 3. Build Launcher
console.log('[3/4] Building Elite Launcher...');
process.chdir(launcherPath);
// Simple launcher build - we just need a tiny electron app
// We'll use electron-builder for the launcher too
execSync('npx electron-builder build --win nsis --publish never -c.productName="VWO Elite Setup" -c.directories.output="../../dist/launcher"', { stdio: 'inherit' });

console.log('--- VWO ELITE v16.0 COMPLETE ---');
console.log('Resulting files in dist/');
console.log('1. dist/launcher/VWO Elite Setup 1.0.0.exe (The instant-on launcher)');
console.log('2. dist/electron/vwo-elite-payload.zip (The app data)');
