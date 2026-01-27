import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const releaseDir = join(root, 'dist/VWO-ELITE-V21-RELEASE');
const launcherSrc = join(root, 'apps/launcher');
const tempDir = join(root, 'dist/_patch_temp');
const sevenZipPath = 'C:\\Program Files\\7-Zip\\7z.exe';

console.log('\n🔧 PATCHING EXISTING LAUNCHER WITH UPDATED CODE...\n');

try {
    // 1. Extract app.asar from existing exe
    console.log('[1/5] Extracting app.asar from launcher...');
    const exePath = join(releaseDir, 'VWO Elite Setup.exe');
    const resourcesPath = `"${exePath}" resources`;

    // Copy exe to temp location to extract its resources
    const tempExe = join(tempDir, 'temp.exe');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    fs.copyFileSync(exePath, tempExe);

    // Use 7zip or similar to extract resources from exe
    // For now, we'll use a PowerShell script to extract from the portable exe
    const extractScript = `
        $sevenZipPath = "${sevenZipPath}"
        if (Test-Path $sevenZipPath) {
            & $sevenZipPath x "${tempExe}" -o"${tempDir}\\extracted" -y resources\\app.asar
        } else {
            Write-Error "7zip not found. Cannot extract ASAR from portable exe."
            exit 1
        }
    `;

    fs.writeFileSync(join(tempDir, 'extract.ps1'), extractScript);
    execSync(`powershell -ExecutionPolicy Bypass -File "${tempDir}\\extract.ps1"`, { stdio: 'inherit' });

    const asarPath = join(tempDir, 'extracted/resources/app.asar');

    // 2. Extract ASAR contents
    console.log('\n[2/5] Extracting ASAR contents...');
    const asarContents = join(tempDir, 'asar-contents');
    execSync(`asar extract "${asarPath}" "${asarContents}"`, { stdio: 'inherit' });

    // 3. Replace updated files
    console.log('\n[3/5] Replacing with updated source files...');
    fs.copyFileSync(
        join(launcherSrc, 'public/splash_cinematic.html'),
        join(asarContents, 'public/splash_cinematic.html')
    );
    fs.copyFileSync(
        join(launcherSrc, 'src/main.js'),
        join(asarContents, 'src/main.js')
    );
    console.log('✓ Replaced splash_cinematic.html');
    console.log('✓ Replaced main.js');

    // 4. Repack ASAR
    console.log('\n[4/5] Repacking ASAR...');
    const newAsar = join(tempDir, 'app.asar');
    execSync(`asar pack "${asarContents}" "${newAsar}"`, { stdio: 'inherit' });

    console.log('\n[5/5] Replacing ASAR in launcher exe...');
    execSync(`powershell -Command "& '${sevenZipPath}' u '${exePath}' '${newAsar}' -mx0"`, { stdio: 'inherit' });

    console.log('\n✅ LAUNCHER PATCHED SUCCESSFULLY!');
    console.log(`Updated: ${exePath}`);
    console.log('\n⚠️  Note: This is a manual patch. The launcher source is updated but');
    console.log('   electron-builder has persistent issues. Consider investigating');
    console.log('   electron-builder compatibility separately.');

} catch (error) {
    console.error('\n❌ PATCH FAILED:', error.message);
    console.log('\n💡 Fallback: Manually extracting and repacking ASAR...');
    process.exit(1);
}
