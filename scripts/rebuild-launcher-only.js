import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const launcherDir = join(root, 'apps/launcher');
const buildOutput = join(root, 'dist/launcher-build');
const finalOutput = join(root, 'dist/VWO-ELITE-V21-RELEASE');

console.log('\n🔨 FORCE REBUILDING LAUNCHER...\n');

try {
    // 1. Clean all build artifacts
    console.log('[1/4] Cleaning build cache...');
    if (fs.existsSync(buildOutput)) {
        try {
            execSync(`powershell -Command "Remove-Item -Recurse -Force '${buildOutput}' -ErrorAction SilentlyContinue"`, { stdio: 'inherit' });
        } catch (e) {
            console.warn('Warning: Could not fully clean build folder. Continuing anyway...');
        }
    }

    // 2. Ensure dependencies
    console.log('\n[2/4] Installing dependencies...');
    process.chdir(launcherDir);
    execSync('pnpm install', { stdio: 'inherit' });

    // 3. Build with no cache
    console.log('\n[3/4] Building launcher (no cache)...');
    execSync('npx electron-builder build --win --config electron-builder.json --publish never --no-cache', { stdio: 'inherit' });

    // 4. Copy to final location
    console.log('\n[4/4] Copying to release folder...');
    const exeFile = fs.readdirSync(buildOutput).find(f => f.endsWith('.exe') && !f.includes('uninstaller'));

    if (exeFile) {
        if (fs.existsSync(join(finalOutput, 'VWO Elite Setup.exe'))) {
            fs.unlinkSync(join(finalOutput, 'VWO Elite Setup.exe'));
        }
        fs.copyFileSync(join(buildOutput, exeFile), join(finalOutput, 'VWO Elite Setup.exe'));
        console.log('\n✅ LAUNCHER REBUILT SUCCESSFULLY');
        console.log(`Location: ${finalOutput}\\VWO Elite Setup.exe`);
    } else {
        throw new Error('Launcher EXE not found in ' + buildOutput);
    }

} catch (error) {
    console.error('\n❌ BUILD FAILED:', error.message);
    process.exit(1);
}
