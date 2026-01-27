import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outputDir = join(root, 'dist/VWO-ELITE-V21-FINAL');
const launcherSrc = join(root, 'apps/launcher');

console.log('\n🔨 MANUAL ELECTRON BUILD (No Builder Tools)\n');

try {
    // Clean output
    if (fs.existsSync(outputDir)) {
        execSync(`powershell -Command "Remove-Item -Recurse -Force '${outputDir}'"`, { stdio: 'inherit' });
    }
    fs.mkdirSync(outputDir, { recursive: true });

    console.log('[1/5] Getting Electron binaries...');
    const electronPath = join(launcherSrc, 'node_modules/electron/dist');

    if (!fs.existsSync(electronPath)) {
        throw new Error('Electron not installed in launcher. Run: cd apps/launcher && pnpm install');
    }

    console.log('[2/5] Copying Electron runtime...');
    execSync(`xcopy "${electronPath}" "${outputDir}" /E /I /H /Y`, { stdio: 'inherit' });

    // 3. Creating ASAR from source
    console.log('\n[3/5] Creating ASAR from source...');
    const asarDir = join(outputDir, 'resources');
    if (!fs.existsSync(asarDir)) {
        fs.mkdirSync(asarDir, { recursive: true });
    }

    // Pack launcher source into ASAR
    const tempAppDir = join(root, 'dist/_temp_app_build');
    if (fs.existsSync(tempAppDir)) {
        execSync(`powershell -Command "Remove-Item -Recurse -Force '${tempAppDir}'"`, { stdio: 'inherit' });
    }

    // Copy launcher source
    fs.mkdirSync(tempAppDir, { recursive: true });
    fs.cpSync(join(launcherSrc, 'src'), join(tempAppDir, 'src'), { recursive: true });
    fs.cpSync(join(launcherSrc, 'public'), join(tempAppDir, 'public'), { recursive: true });
    fs.copyFileSync(join(launcherSrc, 'package.json'), join(tempAppDir, 'package.json'));

    // Create ASAR - Use npx asar to ensure it's found
    execSync(`npx asar pack "${tempAppDir}" "${join(asarDir, 'app.asar')}"`, { stdio: 'inherit' });

    console.log('\n[4/5] Renaming executable...');
    if (fs.existsSync(join(outputDir, 'electron.exe'))) {
        fs.renameSync(join(outputDir, 'electron.exe'), join(outputDir, 'VWO Elite Setup.exe'));
    }

    console.log('\n[5/5] Copying payload to output folder...');
    const payloadSrc = join(root, 'dist/VWO-ELITE-V21-RELEASE/vwo-elite-payload.zip');
    if (fs.existsSync(payloadSrc)) {
        fs.copyFileSync(payloadSrc, join(outputDir, 'vwo-elite-payload.zip'));
        console.log('✓ Payload copied');
    }

    console.log('\n✅ MANUAL BUILD COMPLETE!\n');
    console.log(`Location: ${outputDir}`);
    console.log('\nFolder structure:');
    console.log('  VWO Elite Setup.exe  - Run this');
    console.log('  vwo-elite-payload.zip');
    console.log('  resources/app.asar   - Your updated code');
    console.log('\nTo distribute: zip the entire folder and send it.');

} catch (error) {
    console.error('\n❌ FAILED:', error.message);
    process.exit(1);
}
