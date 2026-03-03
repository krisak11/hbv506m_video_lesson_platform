const fs = require('fs'); // File system module
const path = require('path'); // For handling file paths
const dotenv = require('dotenv');
const Database = require('better-sqlite3'); // SQLite library, synchronous and fast.

const systemEnvPath = '/etc/video-lesson-platform/env';
if (fs.existsSync(systemEnvPath)) {
  dotenv.config({ path: systemEnvPath });
} else {
  dotenv.config();
}
const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'app.db'); // Path to the SQLite database file

// Ensure data folder exists
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);

// Good defaults
db.pragma('journal_mode = WAL'); // Better concurrency & crash resilience
db.pragma('foreign_keys = ON'); // Enforce foreign key constraints

module.exports = db;
