import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const finalLauncher = join(root, 'dist/VWO-ELITE-V21-PATCHED');
const patchedAsar = join(root, 'dist/_asar_patch/app_patched.asar');

console.log('\n📦 CREATING STANDALONE LAUNCHER WITH PATCHED CODE\n');

try {
    if (!fs.existsSync(patchedAsar)) {
        throw new Error('Patched ASAR not found. Run patch-launcher-simple.js first.');
    }

    // Clean output
    if (fs.existsSync(finalLauncher)) {
        execSync(`powershell -Command "Remove-Item -Recurse -Force '${finalLauncher}'"`, { stdio: 'inherit' });
    }
    fs.mkdirSync(finalLauncher, { recursive: true });

    console.log('[1/3] Using electron-packager (simpler than electron-builder)...\n');

    // Install electron-packager if needed
    execSync('npm list -g electron-packager || npm install -g electron-packager', { stdio: 'inherit' });

    // Create a minimal package structure
    const tempPackage = join(root, 'dist/_temp_launcher');
    if (fs.existsSync(tempPackage)) {
        execSync(`powershell -Command "Remove-Item -Recurse -Force '${tempPackage}'"`, { stdio: 'inherit' });
    }
    fs.mkdirSync(tempPackage, { recursive: true });

    // Copy patched ASAR
    fs.mkdirSync(join(tempPackage, 'resources'), { recursive: true });
    fs.copyFileSync(patchedAsar, join(tempPackage, 'resources/app.asar'));

    // Create minimal package.json
    const pkgJson = {
        name: "vwo-elite-setup",
        version: "1.0.0",
        main: "resources/app.asar"
    };
    fs.writeFileSync(join(tempPackage, 'package.json'), JSON.stringify(pkgJson, null, 2));

    console.log('\n[2/3] Packaging with electron-packager...\n');

    // Package
    execSync(
        `electron-packager "${tempPackage}" "VWO Elite Setup" --platform=win32 --arch=x64 --out="${finalLauncher}" --overwrite --asar=false`,
        { stdio: 'inherit', cwd: root }
    );

    console.log('\n[3/3] Copying to release folder...\n');

    // Find the packaged exe
    const packagedDir = fs.readdirSync(finalLauncher)[0];
    const exePath = join(finalLauncher, packagedDir, 'VWO Elite Setup.exe');

    if (fs.existsSync(exePath)) {
        const releaseExe = join(root, 'dist/VWO-ELITE-V21-RELEASE/VWO Elite Setup PATCHED.exe');
        fs.copyFileSync(exePath, releaseExe);

        console.log('✅ SUCCESS!\n');
        console.log(`New launcher: ${releaseExe}`);
        console.log('\nThis launcher has:');
        console.log('  ✓ Real-time installation progress (no mock data)');
        console.log('  ✓ IPC-driven status updates');
        console.log('  ✓ Background extraction with spawn()');
        console.log('\nTest it by running the PATCHED.exe!');
    } else {
        throw new Error('Packaged exe not found');
    }

} catch (error) {
    console.error('\n❌ FAILED:', error.message);
    process.exit(1);
}
