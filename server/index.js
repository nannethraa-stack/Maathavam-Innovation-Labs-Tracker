import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import path from "path";
import { readFileSync, existsSync } from "fs";
import { all, insert, remove, backup } from "./database.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

const PUBLIC_DIR = path.join(__dirname, "..", "public");
const DIST_DIR = path.join(__dirname, "..", "dist");

app.use("/artifacts", express.static(path.join(PUBLIC_DIR, "artifacts")));
app.use("/logo.jpg", express.static(path.join(PUBLIC_DIR, "logo.jpg")));
app.use(express.static(DIST_DIR));

app.get("/api/health", async (req, res) => {
  try {
    const concepts = await all("concepts");
    const expenses = await all("expenses");
    res.json({ concepts: concepts.length, expenses: expenses.length, sample: concepts.slice(0, 3) });
  } catch (err) {
    res.status(500).json({ error: "Failed to load health" });
  }
});

app.get("/api/concepts", async (req, res) => {
  try {
    const concepts = await all("concepts");
    res.json(concepts);
  } catch (err) {
    console.error("Failed to load concepts:", err);
    res.status(500).json({ error: "Failed to load concepts" });
  }
});

app.get("/api/health", async (req, res) => {
  try {
    const concepts = await all("concepts");
    const expenses = await all("expenses");
    res.json({ concepts: concepts.length, expenses: expenses.length, sample: concepts.slice(0, 3) });
  } catch (err) {
    res.status(500).json({ error: "Failed to load health" });
  }
});

app.get("/api/expenses", async (req, res) => {
  try {
    const expenses = await all("expenses");
    res.json(expenses);
  } catch (err) {
    console.error("Failed to load expenses:", err);
    res.status(500).json({ error: "Failed to load expenses" });
  }
});

app.post("/api/concepts", async (req, res) => {
  try {
    await backup();
    const body = req.body || {};
    if (Array.isArray(body)) {
      for (const record of body) {
        await insert("concepts", { ...record, artifacts: JSON.stringify(record.artifacts || []) });
      }
      res.json(body);
      return;
    }
    const record = {
      ...body,
      id: body.id || "c-" + Math.random().toString(36).slice(2, 9),
      createdAt: body.createdAt || new Date().toISOString().slice(0, 10),
      artifacts: JSON.stringify(body.artifacts || []),
    };
    await insert("concepts", record);
    res.json({ ...record, artifacts: body.artifacts || [] });
  } catch (err) {
    console.error("Failed to save concept:", err);
    res.status(500).json({ error: "Failed to save concept" });
  }
});

app.post("/api/expenses", async (req, res) => {
  try {
    await backup();
    const body = req.body || {};
    if (Array.isArray(body)) {
      for (const record of body) {
        await insert("expenses", { ...record, id: record.id || "e-" + Math.random().toString(36).slice(2, 9) });
      }
      res.json(body);
      return;
    }
    const record = {
      id: body.id || "e-" + Math.random().toString(36).slice(2, 9),
      ...body,
    };
    await insert("expenses", record);
    res.json(record);
  } catch (err) {
    console.error("Failed to save expense:", err);
    res.status(500).json({ error: "Failed to save expense" });
  }
});

app.delete("/api/concepts/:id", async (req, res) => {
  try {
    await backup();
    await remove("concepts", req.params.id);
    const expenses = await all("expenses");
    for (const e of expenses.filter((e) => e.conceptId === req.params.id)) {
      await remove("expenses", e.id);
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("Failed to delete concept:", err);
    res.status(500).json({ error: "Failed to delete concept" });
  }
});

app.delete("/api/expenses/:id", async (req, res) => {
  try {
    await backup();
    await remove("expenses", req.params.id);
    res.json({ ok: true });
  } catch (err) {
    console.error("Failed to delete expense:", err);
    res.status(500).json({ error: "Failed to delete expense" });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(DIST_DIR, "index.html"));
});

async function autoImport() {
  try {
    const existing = await all("concepts");
    const existingIds = new Set(existing.map((c) => c.id));
    console.log(`Auto-import check: ${existing.length} existing concepts in database`);

    const conceptsJson = path.join(PUBLIC_DIR, "concepts-data.json");
    if (!existsSync(conceptsJson)) {
      console.log("No concepts-data.json found for auto-import.");
      return;
    }

    const data = JSON.parse(readFileSync(conceptsJson, "utf-8"));
    if (!data.concepts || data.concepts.length === 0) {
      console.log("concepts-data.json is empty.");
      return;
    }

    const newConcepts = data.concepts.filter((c) => !existingIds.has(c.id));
    if (newConcepts.length === 0) {
      console.log("No new concepts to import.");
      return;
    }

    console.log(`Auto-importing ${newConcepts.length} new concepts from concepts-data.json...`);
    for (const c of newConcepts) {
      await insert("concepts", { ...c, artifacts: JSON.stringify(c.artifacts || []) });
    }
    console.log("Auto-import complete.");
  } catch (err) {
    console.error("Auto-import failed:", err);
  }
}

autoImport().then(() => {
  const port = process.env.PORT || 5174;
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}).catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
