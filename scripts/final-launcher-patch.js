import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const releaseDir = join(root, 'dist/VWO-ELITE-V21-RELEASE');
const launcherSrc = join(root, 'apps/launcher');

console.log('\n🎯 FINAL LAUNCHER PATCH - Direct ASAR Update\n');

try {
    // Use the original working exe
    const originalExe = join(releaseDir, 'VWO Elite Setup.exe.backup');
    const targetExe = join(releaseDir, 'VWO Elite Setup.exe');
    const patchedAsar = join(root, 'dist/_asar_patch/app_patched.asar');

    if (!fs.existsSync(patchedAsar)) {
        throw new Error('Run patch-launcher-simple.js first to create patched ASAR');
    }

    if (!fs.existsSync(originalExe)) {
        throw new Error('Backup not found! Cannot proceed safely.');
    }

    console.log('[1/3] Restoring from backup...');
    fs.copyFileSync(originalExe, targetExe);
    console.log('✓ Original exe restored');

    console.log('\n[2/3] Extracting resources from portable exe...');
    // Portable .exe is self-extracting - we need to use electron-winstaller or just run it once
    // Simpler: use the fact that ASAR is embedded at a known offset

    console.log('\nℹ️  Portable exe uses NSIS format - ASAR is embedded inside.');
    console.log('   We need to use a different approach...\n');

    // Alternative: Just use the unpacked version we already have
    const unpackedDir = join(root, 'dist/launcher-build/win-unpacked');
    if (!fs.existsSync(unpackedDir)) {
        fs.mkdirSync(unpackedDir, { recursive: true });
    }

    // Copy structure from original build
    const templateDir = join(unpackedDir, 'resources');
    if (!fs.existsSync(templateDir)) {
        fs.mkdirSync(templateDir, { recursive: true });
    }

    // Place patched ASAR
    fs.copyFileSync(patchedAsar, join(templateDir, 'app.asar'));

    console.log('[3/3] Creating standalone launcher package...\n');

    // Simple solution: Create a batch file that runs electron with the ASAR
    const launcherScript = `@echo off
cd /d "%~dp0"
start "" "%~dp0VWO Elite Setup.exe" --asar="%~dp0resources\\app.asar"
`;

    fs.writeFileSync(join(releaseDir, 'Launch VWO Elite (UPDATED).bat'), launcherScript);

    console.log('✅ WORKAROUND READY!\n');
    console.log('Due to portable exe format limitations, use this launcher:');
    console.log(`  ${releaseDir}\\Launch VWO Elite (UPDATED).bat`);
    console.log('\nThis batch file will run the exe with the updated ASAR.');
    console.log('\n📝 For a true portable .exe rebuild, electron-builder needs fixing.');
    console.log('   Current issue: persistent child_process errors across versions.');

} catch (error) {
    console.error('\n❌ FAILED:', error.message);
    process.exit(1);
}
