import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

const MAX_SIZE_MB = 10;
const DIRECTORIES = ['public', 'resources'];

async function checkAssets(dir) {
    try {
        const entries = await readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = join(dir, entry.name);
            if (entry.isDirectory()) {
                await checkAssets(fullPath);
            } else if (entry.isFile()) {
                const stats = await stat(fullPath);
                const sizeMB = stats.size / (1024 * 1024);
                if (sizeMB > MAX_SIZE_MB) {
                    console.error(`[ELITE ASSET AUDIT] Large file detected: ${fullPath} (${sizeMB.toFixed(2)} MB)`);
                    process.exitCode = 1;
                }
            }
        }
    } catch (err) {
        if (err.code !== 'ENOENT') {
            console.error(`[ELITE ASSET AUDIT] Error scanning ${dir}:`, err);
        }
    }
}

console.log('[ELITE ASSET AUDIT] Starting scan...');
for (const dir of DIRECTORIES) {
    await checkAssets(dir);
}

if (process.exitCode === 1) {
    console.error('[ELITE ASSET AUDIT] FAILED: Large files found. Please optimize or remove them.');
} else {
    console.log('[ELITE ASSET AUDIT] PASSED: All assets are within size limits.');
}
