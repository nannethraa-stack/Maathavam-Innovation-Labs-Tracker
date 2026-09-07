import sqlite3 from "sqlite3";
import { fileURLToPath } from "url";
import path from "path";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "server", "data");
const DB_PATH = path.join(DATA_DIR, "app.sqlite");
const BACKUP_PATH = path.join(DATA_DIR, "app.sqlite.backup");

mkdirSync(DATA_DIR, { recursive: true });

const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS concepts (
    id TEXT PRIMARY KEY,
    name TEXT,
    description TEXT,
    domain TEXT,
    patentStatus TEXT,
    plannedOrgForPOC TEXT,
    status TEXT,
    eta TEXT,
    requiresSensor TEXT,
    artifacts TEXT,
    createdAt TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    conceptId TEXT,
    description TEXT,
    amount REAL,
    source TEXT,
    paidBy TEXT,
    date TEXT
  )`);
});

export function all(table) {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM ${table}`, (err, rows) => {
      if (err) return reject(err);
      resolve(
        rows.map((r) => {
          let artifacts = [];
          if (typeof r.artifacts === "string") {
            try {
              artifacts = JSON.parse(r.artifacts);
            } catch {
              artifacts = [];
            }
          } else if (Array.isArray(r.artifacts)) {
            artifacts = r.artifacts;
          }
          return { ...r, artifacts };
        })
      );
    });
  });
}

export function get(table, id) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM ${table} WHERE id = ?`, [id], (err, row) => {
      if (err) return reject(err);
      if (!row) return resolve(null);
      let artifacts = [];
      if (typeof row.artifacts === "string") {
        try {
          artifacts = JSON.parse(row.artifacts);
        } catch {
          artifacts = [];
        }
      } else if (Array.isArray(row.artifacts)) {
        artifacts = row.artifacts;
      }
      resolve({ ...row, artifacts });
    });
  });
}

export function insert(table, record) {
  return new Promise((resolve, reject) => {
    const keys = Object.keys(record);
    const values = Object.values(record);
    const placeholders = keys.map(() => "?").join(",");
    const sql = `INSERT OR REPLACE INTO ${table} (${keys.join(",")}) VALUES (${placeholders})`;
    db.run(sql, values, function (err) {
      if (err) return reject(err);
      resolve({ ...record, changes: this.changes });
    });
  });
}

export function remove(table, id) {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM ${table} WHERE id = ?`, [id], function (err) {
      if (err) return reject(err);
      resolve({ ok: true, changes: this.changes });
    });
  });
}

export function backup() {
  try {
    if (existsSync(DB_PATH)) {
      copyFileSync(DB_PATH, BACKUP_PATH);
    }
  } catch (err) {
    console.error("Backup failed:", err);
  }
}

export function restoreFromJson() {
  try {
    const conceptsJson = path.join(DATA_DIR, "..", "..", "public", "concepts-data.json");
    if (existsSync(conceptsJson)) {
      const data = JSON.parse(readFileSync(conceptsJson, "utf-8"));
      db.serialize(() => {
        data.concepts.forEach((c) => {
          insert("concepts", { ...c, artifacts: JSON.stringify(c.artifacts || []) });
        });
        data.expenses.forEach((e) => insert("expenses", e));
      });
    }
  } catch (err) {
    console.error("Restore failed:", err);
  }
}
