import { Pool } from "pg";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is required for PostgreSQL connection");
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

async function init() {
  const client = await pool.connect();
  try {
    await client.query(`CREATE TABLE IF NOT EXISTS concepts (
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

    await client.query(`CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      conceptId TEXT,
      description TEXT,
      amount REAL,
      source TEXT,
      paidBy TEXT,
      date TEXT
    )`);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_expenses_conceptId ON expenses(conceptId)`);
  } finally {
    client.release();
  }
}

init().catch((err) => {
  console.error("Failed to initialize database:", err);
  process.exit(1);
});

export async function all(table) {
  const result = await pool.query(`SELECT * FROM ${table}`);
  return result.rows.map((r) => ({
    ...r,
    artifacts: r.artifacts ? JSON.parse(r.artifacts) : [],
  }));
}

export async function get(table, id) {
  const result = await pool.query(`SELECT * FROM ${table} WHERE id = $1`, [id]);
  const row = result.rows[0];
  if (!row) return null;
  return {
    ...row,
    artifacts: row.artifacts ? JSON.parse(row.artifacts) : [],
  };
}

export async function insert(table, record) {
  const keys = Object.keys(record);
  const values = Object.values(record);
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(",");
  const sql = `INSERT INTO ${table} (${keys.join(",")}) VALUES (${placeholders}) ON CONFLICT (id) DO UPDATE SET ${keys.map((k) => `${k} = EXCLUDED.${k}`).join(",")}`;
  await pool.query(sql, values);
  return record;
}

export async function remove(table, id) {
  await pool.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
  return { ok: true };
}

export async function query(text, params) {
  return pool.query(text, params);
}

export async function backup() {
  try {
    const result = await pool.query("SELECT now()");
    console.log("Backup check at:", result.rows[0].now);
  } catch (err) {
    console.error("Backup check failed:", err);
  }
}
