import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'databases', 'app.db');
console.log('Checking database at:', dbPath);

if (!fs.existsSync(dbPath)) {
    console.log('Database file does not exist!');
    process.exit(1);
}

const db = new Database(dbPath);
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables found:', tables.map(t => t.name).join(', '));

const columns = db.prepare("PRAGMA table_info(gym_progress)").all();
console.log('gym_progress columns:', columns.map(c => c.name).join(', '));
db.close();
