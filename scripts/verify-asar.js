import { existsSync, readdirSync } from 'fs';
import { join } from 'path';

const ASAR_UNPACKED_PATH = 'dist/electron/win-unpacked/resources/app.asar.unpacked/node_modules';
const REQUIRED_NATIVES = ['better-sqlite3', 'sharp'];

console.log('Verifying ASAR Unpack status...');

if (!existsSync(ASAR_UNPACKED_PATH)) {
    console.error(`ERROR: ASAR unpacked dir not found at ${ASAR_UNPACKED_PATH}`);
    console.log('Make sure you ran "pnpm run build" first.');
    process.exit(1);
}

const unpackedModules = readdirSync(ASAR_UNPACKED_PATH);
let allFound = true;

for (const native of REQUIRED_NATIVES) {
    if (unpackedModules.includes(native)) {
        console.log(`[PASS] Native module ${native} is correctly unpacked.`);
    } else {
        console.warn(`[FAIL] Native module ${native} is MISSING from unpacked directory!`);
        allFound = false;
    }
}

if (!allFound) {
    console.error('ASAR Verification Failed: Essential native modules were not unpacked.');
    process.exit(1);
}

console.log('ASAR VERIFICATION: SUCCESS');
