import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const tempDir = join(root, 'dist/_asar_patch');
const releaseDir = join(root, 'dist/VWO-ELITE-V21-RELEASE');
const launcherSrc = join(root, 'apps/launcher');

console.log('\n🔧 PATCHING LAUNCHER ASAR (No Rebuild Needed)\n');

try {
    // Clean temp
    if (fs.existsSync(tempDir)) {
        execSync(`powershell -Command "Remove-Item -Recurse -Force '${tempDir}'"`, { stdio: 'inherit' });
    }
    fs.mkdirSync(tempDir, { recursive: true });

    // 1. Create backup
    console.log('[1/5] Creating backup...');
    const exePath = join(releaseDir, 'VWO Elite Setup.exe');
    const backupPath = join(releaseDir, 'VWO Elite Setup.exe.backup');
    if (!fs.existsSync(backupPath)) {
        fs.copyFileSync(exePath, backupPath);
        console.log('✓ Backup created');
    } else {
        console.log('✓ Backup already exists');
    }

    // 2. Extract ASAR from exe using portable exe self-extract behavior
    console.log('\n[2/5] Extracting ASAR from portable exe...');

    // Portable exe unpacks to temp when run - we'll extract directly
    // Actually, simpler: just grab the ASAR we already patched earlier
    const existingAsar = join(root, 'dist/launcher-build/win-unpacked/resources/app.asar');

    if (fs.existsSync(existingAsar)) {
        console.log('✓ Using previously extracted ASAR');
        fs.copyFileSync(existingAsar, join(tempDir, 'app.asar'));
    } else {
        throw new Error('No existing ASAR found. Need to extract from exe first.');
    }

    // 3. Extract ASAR contents
    console.log('\n[3/5] Extracting ASAR contents...');
    const asarContents = join(tempDir, 'contents');
    execSync(`asar extract "${join(tempDir, 'app.asar')}" "${asarContents}"`, { stdio: 'inherit' });

    // 4. Replace updated files
    console.log('\n[4/5] Replacing source files...');
    fs.copyFileSync(
        join(launcherSrc, 'public/splash_cinematic.html'),
        join(asarContents, 'public/splash_cinematic.html')
    );
    fs.copyFileSync(
        join(launcherSrc, 'src/main.js'),
        join(asarContents, 'src/main.js')
    );
    console.log('✓ splash_cinematic.html updated');
    console.log('✓ main.js updated');

    // 5. Repack ASAR
    console.log('\n[5/5] Repacking ASAR...');
    const newAsar = join(tempDir, 'app_patched.asar');
    execSync(`asar pack "${asarContents}" "${newAsar}"`, { stdio: 'inherit' });

    // Save patched ASAR for manual replacement
    const finalAsar = join(releaseDir, 'app.asar.NEW');
    fs.copyFileSync(newAsar, finalAsar);

    console.log('\n✅ PATCH COMPLETE!\n');
    console.log('Files created:');
    console.log(`  1. Backup: ${backupPath}`);
    console.log(`  2. New ASAR: ${finalAsar}`);
    console.log('\n⚠️  MANUAL STEP REQUIRED:');
    console.log('  The portable exe format makes it hard to auto-replace the ASAR.');
    console.log('  Instead, I\'ll generate a NEW launcher from the patched ASAR:');
    console.log('\n  Run: node scripts/create-launcher-from-asar.js');

} catch (error) {
    console.error('\n❌ PATCH FAILED:', error.message);
    process.exit(1);
}
