const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(process.cwd(), 'databases', 'app.db');
console.log('Diagnostic: Checking database at:', dbPath);

if (!fs.existsSync(dbPath)) {
    console.log('Error: Database file does not exist!');
    process.exit(1);
}

const db = new Database(dbPath);
try {
    const history = db.prepare("SELECT id, engine_id, timestamp, datetime(timestamp, 'unixepoch') as dt_s, datetime(timestamp/1000, 'unixepoch') as dt_ms FROM gym_history LIMIT 10").all();
    console.log('Gym History (First 10 rows):');
    console.table(history);

    const progress = db.prepare("SELECT engine_id, skill_key, box_level, next_review, datetime(next_review/1000, 'unixepoch') as next_dt FROM gym_progress LIMIT 10").all();
    console.log('Gym Progress (First 10 rows):');
    console.table(progress);

    // Check for wordCount in metrics
    const metricsCheck = db.prepare("SELECT id, metrics FROM gym_history WHERE metrics IS NOT NULL LIMIT 5").all();
    console.log('Metrics samples:');
    metricsCheck.forEach(r => {
        console.log(`ID ${r.id}:`, r.metrics);
    });

} catch (e) {
    console.error('Error during diagnostic:', e);
} finally {
    db.close();
}
