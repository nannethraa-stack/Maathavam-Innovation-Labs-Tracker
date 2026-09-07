import { Pool } from "pg";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function cleanup() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const result = await client.query("DELETE FROM concepts WHERE name LIKE $1 OR name LIKE $2 RETURNING id, name", [
      "Test Concept %",
      "Cascade Test",
    ]);

    await client.query("COMMIT");
    console.log(`Removed ${result.rowCount} test concepts:`, result.rows);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Cleanup failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

cleanup();
