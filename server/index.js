import express from "express";
import cors from "cors";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

const DATA_DIR = path.join(__dirname, "data");
const CONCEPTS_FILE = path.join(DATA_DIR, "concepts.json");
const EXPENSES_FILE = path.join(DATA_DIR, "expenses.json");
const PUBLIC_DIR = path.join(__dirname, "..", "public");
const DIST_DIR = path.join(__dirname, "..", "dist");

mkdirSync(DATA_DIR, { recursive: true });

function readJson(file, fallback) {
  try {
    if (existsSync(file)) return JSON.parse(readFileSync(file, "utf-8"));
  } catch {}
  return fallback;
}

function writeJson(file, data) {
  writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
}

app.use("/artifacts", express.static(path.join(PUBLIC_DIR, "artifacts")));
app.use("/logo.jpg", express.static(path.join(PUBLIC_DIR, "logo.jpg")));
app.use(express.static(DIST_DIR));

app.get("/api/concepts", (req, res) => {
  res.json(readJson(CONCEPTS_FILE, []));
});

app.get("/api/expenses", (req, res) => {
  res.json(readJson(EXPENSES_FILE, []));
});

app.post("/api/concepts", (req, res) => {
  const concepts = readJson(CONCEPTS_FILE, []);
  const body = req.body || {};
  const record = {
    id: body.id || "c-" + Math.random().toString(36).slice(2, 9),
    createdAt: body.createdAt || new Date().toISOString().slice(0, 10),
    artifacts: body.artifacts || [],
    ...body,
  };
  if (record.id && concepts.find((c) => c.id === record.id)) {
    const idx = concepts.findIndex((c) => c.id === record.id);
    concepts[idx] = record;
  } else {
    concepts.unshift(record);
  }
  writeJson(CONCEPTS_FILE, concepts);
  res.json(record);
});

app.post("/api/expenses", (req, res) => {
  const expenses = readJson(EXPENSES_FILE, []);
  const body = req.body || {};
  const record = {
    id: body.id || "e-" + Math.random().toString(36).slice(2, 9),
    ...body,
  };
  if (record.id && expenses.find((e) => e.id === record.id)) {
    const idx = expenses.findIndex((e) => e.id === record.id);
    expenses[idx] = record;
  } else {
    expenses.unshift(record);
  }
  writeJson(EXPENSES_FILE, expenses);
  res.json(record);
});

app.delete("/api/concepts/:id", (req, res) => {
  const concepts = readJson(CONCEPTS_FILE, []).filter((c) => c.id !== req.params.id);
  const expenses = readJson(EXPENSES_FILE, []).filter((e) => e.conceptId !== req.params.id);
  writeJson(CONCEPTS_FILE, concepts);
  writeJson(EXPENSES_FILE, expenses);
  res.json({ ok: true });
});

app.delete("/api/expenses/:id", (req, res) => {
  const expenses = readJson(EXPENSES_FILE, []).filter((e) => e.id !== req.params.id);
  writeJson(EXPENSES_FILE, expenses);
  res.json({ ok: true });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(DIST_DIR, "index.html"));
});

const port = process.env.PORT || 5174;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
