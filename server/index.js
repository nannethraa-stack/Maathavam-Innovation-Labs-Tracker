import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import path from "path";
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

app.get("/api/concepts", async (req, res) => {
  try {
    const concepts = await all("concepts");
    res.json(concepts);
  } catch (err) {
    res.status(500).json({ error: "Failed to load concepts" });
  }
});

app.get("/api/expenses", async (req, res) => {
  try {
    const expenses = await all("expenses");
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: "Failed to load expenses" });
  }
});

app.post("/api/concepts", async (req, res) => {
  try {
    backup();
    const body = req.body || {};
    if (Array.isArray(body)) {
      for (const record of body) {
        await insert("concepts", { ...record, artifacts: JSON.stringify(record.artifacts || []) });
      }
      res.json(body);
      return;
    }
    const record = {
      id: body.id || "c-" + Math.random().toString(36).slice(2, 9),
      createdAt: body.createdAt || new Date().toISOString().slice(0, 10),
      artifacts: JSON.stringify(body.artifacts || []),
      ...body,
    };
    await insert("concepts", record);
    res.json({ ...record, artifacts: body.artifacts || [] });
  } catch (err) {
    res.status(500).json({ error: "Failed to save concept" });
  }
});

app.post("/api/expenses", async (req, res) => {
  try {
    backup();
    const body = req.body || {};
    const record = {
      id: body.id || "e-" + Math.random().toString(36).slice(2, 9),
      ...body,
    };
    await insert("expenses", record);
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: "Failed to save expense" });
  }
});

app.delete("/api/concepts/:id", async (req, res) => {
  try {
    backup();
    await remove("concepts", req.params.id);
    const expenses = await all("expenses");
    for (const e of expenses.filter((e) => e.conceptId === req.params.id)) {
      await remove("expenses", e.id);
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete concept" });
  }
});

app.delete("/api/expenses/:id", async (req, res) => {
  try {
    backup();
    await remove("expenses", req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete expense" });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(DIST_DIR, "index.html"));
});

const port = process.env.PORT || 5174;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

