const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(process.cwd(), 'databases', 'app.db');
console.log('[Repair] Connecting to:', dbPath);

if (!fs.existsSync(dbPath)) {
    console.error('[Error] Database not found.');
    process.exit(1);
}

const db = new Database(dbPath);

try {
    // 1. Identify rows in "seconds" range (less than 10^12)
    // Current time is ~1.7e12. Seconds range is ~1.7e9.
    const threshold = 10000000000; // 10 billion

    console.log('[Repair] Checking for timestamps in seconds range...');
    const targetRows = db.prepare("SELECT COUNT(*) as count FROM gym_history WHERE timestamp < ?").get(threshold);

    if (targetRows.count === 0) {
        console.log('[Repair] No legacy timestamps found. Data is already synchronized.');
    } else {
        console.log(`[Repair] Found ${targetRows.count} rows to fix.`);

        const result = db.prepare("UPDATE gym_history SET timestamp = timestamp * 1000 WHERE timestamp < ?").run(threshold);
        console.log(`[Repair] Successfully updated ${result.changes} records.`);
    }

    // 2. Also check gym_progress next_review (though usually these are already in ms from code)
    const progRows = db.prepare("SELECT COUNT(*) as count FROM gym_progress WHERE next_review < ?").get(threshold);
    if (progRows.count > 0) {
        console.log(`[Repair] Fixing ${progRows.count} progress records.`);
        db.prepare("UPDATE gym_progress SET next_review = next_review * 1000 WHERE next_review < ?").run(threshold);
    }

    console.log('[Repair] Verification:');
    const sample = db.prepare("SELECT id, timestamp, datetime(timestamp/1000, 'unixepoch') as dt FROM gym_history ORDER BY timestamp DESC LIMIT 3").all();
    console.table(sample);

} catch (e) {
    console.error('[Repair] Failed:', e);
} finally {
    db.close();
}
