import { readFileSync, existsSync, copyFileSync, writeFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import sqlite3 from "sqlite3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "server", "data");
const DB_PATH = path.join(DATA_DIR, "app.sqlite");
const BACKUP_PATH = path.join(DATA_DIR, "app.sqlite.backup");

mkdirSync(DATA_DIR, { recursive: true });

if (existsSync(DB_PATH)) {
  copyFileSync(DB_PATH, BACKUP_PATH);
  console.log("Existing database backed up to:", BACKUP_PATH);
}

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

const conceptsJson = path.join(DATA_DIR, "..", "..", "public", "concepts-data.json");
if (existsSync(conceptsJson)) {
  const data = JSON.parse(readFileSync(conceptsJson, "utf-8"));
  
  const insertConcept = db.prepare(`INSERT OR REPLACE INTO concepts (id, name, description, domain, patentStatus, plannedOrgForPOC, status, eta, requiresSensor, artifacts, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  data.concepts.forEach((c) => {
    insertConcept.run([
      c.id,
      c.name,
      c.description || "",
      c.domain || "",
      c.patentStatus || "Not started",
      c.plannedOrgForPOC || "",
      c.status || "idea",
      c.eta || "",
      c.requiresSensor || "No",
      JSON.stringify(c.artifacts || []),
      c.createdAt || new Date().toISOString().slice(0, 10),
    ]);
  });

  insertConcept.finalize();

  if (data.expenses && data.expenses.length > 0) {
    const insertExpense = db.prepare(`INSERT OR REPLACE INTO expenses (id, conceptId, description, amount, source, paidBy, date) VALUES (?, ?, ?, ?, ?, ?, ?)`);
    
    data.expenses.forEach((e) => {
      insertExpense.run([
        e.id,
        e.conceptId,
        e.description,
        e.amount,
        e.source,
        e.paidBy || "",
        e.date,
      ]);
    });

    insertExpense.finalize();
  }

  console.log(`Migrated ${data.concepts.length} concepts and ${data.expenses?.length || 0} expenses to SQLite.`);
} else {
  console.log("No concepts-data.json found, starting with empty database.");
}

db.close();
console.log("Migration complete. Database:", DB_PATH);
