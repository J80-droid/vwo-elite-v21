import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const dist = join(root, 'dist/electron');
const launcherDir = join(root, 'apps/launcher');
const finalOutput = join(root, 'dist/VWO-ELITE-V21-FINAL');

console.log('\n--- 👑 VWO ELITE v21.0 MASTER BUILD START 👑 ---');

// 0. Cleanup lingered processes
console.log('\n[0/4] Cleaning environment (Aggressive Mode)...');
try {
    // Kill any process starting with VWO
    execSync('powershell -Command "Get-Process | Where-Object { $_.Name -like \'VWO*\' } | Stop-Process -Force"', { stdio: 'ignore' });
    // Kill any lingering electron-builder or app-builder processes
    execSync('taskkill /F /IM "app-builder.exe" /T', { stdio: 'ignore' });
    // Small delay to let OS release file locks
    execSync('powershell -Command "Start-Sleep -Seconds 2"', { stdio: 'ignore' });
} catch (e) { }

// Pre-purge all build directories to avoid locks later
const dirToPurge = [
    join(root, 'dist/electron'),
    join(root, 'dist/launcher-build'),
    join(root, 'dist/VWO-ELITE-V21-FINAL')
];

dirToPurge.forEach(dir => {
    if (fs.existsSync(dir)) {
        console.log(`[0/4] Purging: ${dir}`);
        try {
            // Using a more patient removal method
            execSync(`powershell -Command "Remove-Item -Recurse -Force '${dir}' -ErrorAction SilentlyContinue"`, { timeout: 5000 });
        } catch (e) {
            console.warn(`[Warning] Could not fully purge ${dir}. A process might still hold a lock, but we will attempt to continue.`);
        }
    }
});

const unpackedDir = join(dist, 'win-unpacked');
const payloadTar = join(finalOutput, 'vwo-elite-payload.tar');

try {
    if (!fs.existsSync(finalOutput)) fs.mkdirSync(finalOutput, { recursive: true });

    // 2. Build Main App (The 1.5GB Payload)
    console.log('\n[1/4] Containerizing Main App (1.5GB)...');
    process.chdir(root);
    execSync('pnpm run build', { stdio: 'inherit' });
    // Build as directory to avoid the NSIS overhead here
    execSync('npx electron-builder build --win dir --publish never', { stdio: 'inherit' });

    // 3. Pack the payload into a TAR
    console.log('\n[2/4] Packing Payload for backshadow extraction (TAR mode)...');
    if (fs.existsSync(payloadTar)) fs.unlinkSync(payloadTar);
    // Switch to directory and pack everything to avoid the "./" prefix which some TAR versions dislike
    execSync(`cd /d "${unpackedDir}" && tar -cf "${payloadTar}" *`, { stdio: 'inherit' });

    // 4. Build the Launcher (The 60MB 'Instant-On' EXE)
    console.log('\n[3/4] Building Elite Launcher (~60MB)...');
    process.chdir(launcherDir);
    // Ensure dependencies are there
    execSync('pnpm install', { stdio: 'inherit' });

    // Build the launcher as a monolithic setup (but it's tiny, so it's fast)
    // Cleanup dist/launcher-build first to avoid "file in use" errors
    const lBuildDir = join(root, 'dist/launcher-build');
    if (fs.existsSync(lBuildDir)) {
        try { fs.rmSync(lBuildDir, { recursive: true, force: true }); } catch (e) { }
    }

    execSync('npx electron-builder build --win --config electron-builder.json --publish never', { stdio: 'inherit' });

    // 5. Final Assembly
    console.log('\n[4/4] Assembling Final Release...');
    const buildDir = join(root, 'dist/launcher-build');
    const files = fs.readdirSync(buildDir);

    // For portable/nsis, find the main installer EXE
    const exeFile = files.find(f => f.endsWith('.exe') && !f.includes('uninstaller') && !f.includes('blockmap'));

    if (exeFile) {
        console.log(`[Final] Found Launcher: ${exeFile}`);
        fs.copyFileSync(join(buildDir, exeFile), join(finalOutput, 'VWO Elite Setup.exe'));
    } else {
        throw new Error('Launcher EXE not found in ' + buildDir);
    }

    console.log('\n--- ✅ VWO ELITE v21.0 COMPLETE ✅ ---');
    console.log('Location:', finalOutput);
    console.log('Artifacts:');
    console.log('  - VWO Elite Setup.exe (Launch this!)');
    console.log('  - vwo-elite-payload.tar (Must be in same folder)');

    // Final Cleanup (Developer Workspace)
    console.log('\n[FINAL] Cleaning up intermediate build artifacts...');
    // We keep dist/electron for verification of the 1.5GB source if needed
    [join(root, 'dist/launcher-build'), join(root, 'out')].forEach(dir => {
        if (fs.existsSync(dir)) {
            try { execSync(`powershell -Command "Remove-Item -Recurse -Force '${dir}' -ErrorAction SilentlyContinue"`); } catch (e) { }
        }
    });

} catch (error) {
    console.error('\n❌ BUILD FAILED:', error.message);
    process.exit(1);
}
