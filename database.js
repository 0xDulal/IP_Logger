const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'logs.db');
const db = new Database(dbPath);

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip TEXT,
    device TEXT,
    os TEXT,
    browser TEXT,
    city TEXT,
    region TEXT,
    country TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

const insertLog = (log) => {
  const info = db.prepare(`
    INSERT INTO logs (ip, device, os, browser, city, region, country)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(log.ip, log.device, log.os, log.browser, log.city, log.region, log.country);
  
  return { ...log, id: info.lastInsertRowid, timestamp: new Date().toISOString() };
};

const getAllLogs = () => {
  return db.prepare('SELECT * FROM logs ORDER BY timestamp DESC LIMIT 100').all();
};

module.exports = {
  insertLog,
  getAllLogs
};
