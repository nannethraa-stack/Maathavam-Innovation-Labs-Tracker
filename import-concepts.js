import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SOURCE_DIR = "C:\\Users\\Yoga\\Desktop\\Sundar\\Meetings\\Artifacts folders";
const ARTIFACTS_DIR = path.join(__dirname, "public", "artifacts");
const OUTPUT_FILE = path.join(__dirname, "public", "concepts-data.json");

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".doc": "application/msword",
    ".txt": "text/plain",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".xls": "application/vnd.ms-excel",
    ".ppt": "application/vnd.ms-powerpoint",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".mp4": "video/mp4",
    ".mov": "video/quicktime",
  };
  return map[ext] || "application/octet-stream";
}

function formatSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function slugify(label) {
  return label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "concept";
}

const folders = fs.readdirSync(SOURCE_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

const concepts = [];
const expenses = [];

fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

for (const folder of folders) {
  const conceptId = "c-" + Math.random().toString(36).slice(2, 9);
  const folderPath = path.join(SOURCE_DIR, folder);
  const files = fs.readdirSync(folderPath)
    .map((f) => ({ name: f, fullPath: path.join(folderPath, f) }))
    .filter((f) => {
      try {
        return fs.statSync(f.fullPath).isFile();
      } catch {
        return false;
      }
    });

  const artifacts = files.map(({ name: fileName, fullPath }) => {
    const stat = fs.statSync(fullPath);
    const safeName = fileName.replace(/[^a-zA-Z0-9_.-]/g, "_");
    const destDir = path.join(ARTIFACTS_DIR, conceptId);
    fs.mkdirSync(destDir, { recursive: true });
    const destPath = path.join(destDir, safeName);
    fs.copyFileSync(fullPath, destPath);

    return {
      id: "a-" + Math.random().toString(36).slice(2, 9),
      name: fileName,
      type: getMimeType(fullPath),
      size: stat.size,
      url: `/artifacts/${conceptId}/${encodeURIComponent(safeName)}`,
      uploadedAt: new Date().toISOString().slice(0, 10),
    };
  });

  const concept = {
    id: conceptId,
    name: folder,
    description: "",
    domain: "",
    patentStatus: "Not started",
    plannedOrgForPOC: "",
    status: "idea",
    eta: "",
    requiresSensor: "No",
    artifacts,
    createdAt: new Date().toISOString().slice(0, 10),
  };

  concepts.push(concept);
}

const data = { concepts, expenses };

fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2), "utf-8");

console.log(`Imported ${concepts.length} concepts with ${concepts.reduce((s, c) => s + c.artifacts.length, 0)} artifacts.`);
console.log(`Concepts JSON: ${OUTPUT_FILE}`);
console.log(`Artifacts copied to: ${ARTIFACTS_DIR}`);
