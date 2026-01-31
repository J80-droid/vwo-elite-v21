import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'databases', 'app.db');
const db = new Database(dbPath);

console.log('--- LATEST 5 ENTRIES IN GYM_HISTORY ---');
try {
    const rows = db.prepare('SELECT * FROM gym_history ORDER BY id DESC LIMIT 5').all();
    rows.forEach(row => {
        console.log(`ID: ${row.id} | Engine: ${row.engine_id} | Correct: ${row.is_correct} | Score: ${row.score}`);
        console.log(`Metrics: ${row.metrics || 'NULL'}`);
        console.log('-----------------------------------');
    });
} catch (e) {
    console.error('Error querying gym_history:', e.message);
}
db.close();
