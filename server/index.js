import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import path from "path";
import { readFileSync, existsSync } from "fs";
import { all, insert } from "./database.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

const PUBLIC_DIR = path.join(__dirname, "..", "public");
const DIST_DIR = path.join(__dirname, "..", "dist");

app.use("/artifacts", express.static(path.join(PUBLIC_DIR, "artifacts")));
app.use("/logo.jpg", express.static(path.join(PUBLIC_DIR, "logo.jpg")));
app.use(express.static(DIST_DIR));

async function autoImport() {
  try {
    const existing = await all("concepts");
    const existingIds = new Set(existing.map((c) => c.id));

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
