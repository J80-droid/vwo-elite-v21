import { _electron as electron } from 'playwright';
import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

(async () => {
    console.log('🚀 Starting VWO Elite Smoke Test...');

    const electronApp = await electron.launch({
        args: [path.join(__dirname, '../out/main/index.js')],
        executablePath: process.env.VITE_DEV_SERVER_URL ? undefined : undefined, // Will use electron from node_modules
    });

    try {
        const window = await electronApp.firstWindow();
        console.log('✅ Window captured.');

        await window.waitForLoadState('domcontentloaded');
        console.log('✅ DOM content loaded.');

        // 1. Verify IPC Bridge (with retries for race conditions)
        let vwoApiAvailable = false;
        for (let i = 0; i < 10; i++) {
            vwoApiAvailable = await window.evaluate(() => typeof window.vwoApi !== 'undefined');
            if (vwoApiAvailable) break;
            console.log(`⏳ Waiting for vwoApi... (attempt ${i + 1})`);
            await new Promise(r => setTimeout(r, 500));
        }

        if (!vwoApiAvailable) {
            const htmlSnippet = await window.content();
            console.log('📄 HTML Snippet (first 500 chars):', htmlSnippet.substring(0, 500));
            throw new Error('❌ window.vwoApi is not defined! IPC bridge failed.');
        }
        console.log('✅ IPC Bridge (vwoApi) detected.');

        // 2. Verified SQLite Native Module (Read/Write)
        console.log('🧪 Testing SQLite Native Module...');
        try {
            await window.evaluate(async () => {
                await window.vwoApi.db.query({
                    sql: 'CREATE TABLE IF NOT EXISTS __smoke_test (id INTEGER PRIMARY KEY, val TEXT)',
                    method: 'run'
                });
                await window.vwoApi.db.query({
                    sql: 'INSERT INTO __smoke_test (val) VALUES (?)',
                    params: ['elite_check'],
                    method: 'run'
                });
                const result = await window.vwoApi.db.query({
                    sql: 'SELECT val FROM __smoke_test WHERE val = ?',
                    params: ['elite_check'],
                    method: 'get'
                });

                if (!result || result.val !== 'elite_check') {
                    throw new Error('SQLite read/write failed or data mismatch');
                }

                await window.vwoApi.db.query({ sql: 'DROP TABLE __smoke_test', method: 'run' });
            });
            console.log('✅ SQLite Native Module verified (better-sqlite3 is functional).');
        } catch (dbError) {
            throw new Error(`❌ SQLite Native Module check failed: ${dbError.message}`);
        }

        console.log('✅ Basic functional sanity check passed.');

        await electronApp.close();
        console.log('🏁 Smoke test completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Smoke test failed:', error);
        await electronApp.close();
        process.exit(1);
    }
})();
