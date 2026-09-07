import { Pool } from "pg";
import { readFileSync, existsSync, copyFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "server", "data");
const DB_PATH = path.join(DATA_DIR, "app.sqlite");
const BACKUP_PATH = path.join(DATA_DIR, "app.sqlite.backup");

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL is required. Set it to your PostgreSQL connection string.");
  process.exit(1);
}

async function migrate() {
  if (existsSync(DB_PATH)) {
    copyFileSync(DB_PATH, BACKUP_PATH);
    console.log("SQLite backup created at:", BACKUP_PATH);
  }

  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS concepts (
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

    await pool.query(`CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      conceptId TEXT,
      description TEXT,
      amount REAL,
      source TEXT,
      paidBy TEXT,
      date TEXT
    )`);

    await pool.query(`CREATE INDEX IF NOT EXISTS idx_expenses_conceptId ON expenses(conceptId)`);

    const conceptsJson = path.join(DATA_DIR, "..", "..", "public", "concepts-data.json");
    if (existsSync(conceptsJson)) {
      const data = JSON.parse(readFileSync(conceptsJson, "utf-8"));
      
      for (const c of data.concepts) {
        await pool.query(
          `INSERT INTO concepts (id, name, description, domain, patentStatus, plannedOrgForPOC, status, eta, requiresSensor, artifacts, createdAt)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           domain = EXCLUDED.domain,
           patentStatus = EXCLUDED.patentStatus,
           plannedOrgForPOC = EXCLUDED.plannedOrgForPOC,
           status = EXCLUDED.status,
           eta = EXCLUDED.eta,
           requiresSensor = EXCLUDED.requiresSensor,
           artifacts = EXCLUDED.artifacts,
           createdAt = EXCLUDED.createdAt`,
          [
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
          ]
        );
      }

      if (data.expenses && data.expenses.length > 0) {
        for (const e of data.expenses) {
          await pool.query(
            `INSERT INTO expenses (id, conceptId, description, amount, source, paidBy, date)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (id) DO UPDATE SET
             conceptId = EXCLUDED.conceptId,
             description = EXCLUDED.description,
             amount = EXCLUDED.amount,
             source = EXCLUDED.source,
             paidBy = EXCLUDED.paidBy,
             date = EXCLUDED.date`,
            [e.id, e.conceptId, e.description, e.amount, e.source, e.paidBy || "", e.date]
          );
        }
      }

      console.log(`Migrated ${data.concepts.length} concepts and ${data.expenses?.length || 0} expenses to PostgreSQL.`);
    } else {
      console.log("No concepts-data.json found. PostgreSQL tables are ready.");
    }

    const conceptsResult = await pool.query("SELECT COUNT(*) FROM concepts");
    const expensesResult = await pool.query("SELECT COUNT(*) FROM expenses");
    console.log("PostgreSQL concepts count:", conceptsResult.rows[0].count);
    console.log("PostgreSQL expenses count:", expensesResult.rows[0].count);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
