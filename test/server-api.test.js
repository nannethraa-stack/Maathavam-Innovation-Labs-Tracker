import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { spawn } from "child_process";
import http from "http";
import { copyFileSync, existsSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");

const PORT = 5175;
const BASE = `http://localhost:${PORT}`;
const DATA_DIR = path.join(PROJECT_ROOT, "server", "data");
const DB_PATH = path.join(DATA_DIR, "app.sqlite");
const TEST_DB_PATH = path.join(DATA_DIR, "app.test.sqlite");
const BACKUP_DIR = path.join(DATA_DIR, "__test_backup__");

let server;

function request(method, reqPath, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(reqPath, BASE);
    const data = body ? JSON.stringify(body) : null;
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      headers: data ? { "Content-Type": "application/json" } : {},
    };
    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

beforeAll(async () => {
  if (!process.env.DATABASE_URL) {
    console.log("Skipping server API tests: DATABASE_URL not set");
    return;
  }

  mkdirSync(BACKUP_DIR, { recursive: true });

  if (existsSync(DB_PATH)) {
    copyFileSync(DB_PATH, path.join(BACKUP_DIR, "app.sqlite"));
  }

  if (existsSync(TEST_DB_PATH)) {
    copyFileSync(TEST_DB_PATH, DB_PATH);
  } else if (existsSync(DB_PATH)) {
    copyFileSync(DB_PATH, TEST_DB_PATH);
  }

  server = spawn("node", ["server/index.js"], {
    cwd: PROJECT_ROOT,
    env: { ...process.env, PORT: String(PORT) },
  });
  server.stdout.on("data", (data) => {
    const msg = data.toString();
    if (msg.includes("Server listening")) {
      global.triggerServerReady && global.triggerServerReady();
    }
  });
  server.stderr.on("data", (data) => console.error("SERVER STDERR:", data.toString()));
  await new Promise((resolve) => {
    global.triggerServerReady = resolve;
    setTimeout(resolve, 3000);
  });
});

afterAll(async () => {
  if (!process.env.DATABASE_URL) {
    return;
  }

  server.kill("SIGTERM");
  await new Promise((resolve) => setTimeout(resolve, 1000));

  if (existsSync(path.join(BACKUP_DIR, "app.sqlite"))) {
    copyFileSync(path.join(BACKUP_DIR, "app.sqlite"), DB_PATH);
  }
});

const runServerTests = process.env.DATABASE_URL ? describe : describe.skip;

runServerTests("Concepts API", () => {
  it("GET /api/concepts returns array", async () => {
    const res = await request("GET", "/api/concepts");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });

  it("POST /api/concepts accepts full array without creating blank rows", async () => {
    const concepts = await request("GET", "/api/concepts");
    const beforeCount = concepts.data.length;

    const post = await request("POST", "/api/concepts", concepts.data);
    expect(post.status).toBe(200);
    expect(Array.isArray(post.data)).toBe(true);

    const after = await request("GET", "/api/concepts");
    expect(after.data.length).toBe(beforeCount);

    const blankRows = after.data.filter((c) => !c.name || c.name.trim() === "");
    expect(blankRows.length).toBe(0);
  });

  it("POST /api/concepts accepts single object", async () => {
    const newConcept = {
      id: "c-test-" + Date.now(),
      name: "Test Concept " + Date.now(),
      description: "",
      domain: "",
      patentStatus: "Not started",
      plannedOrgForPOC: "",
      status: "idea",
      eta: "",
      requiresSensor: "No",
      artifacts: [],
      createdAt: new Date().toISOString().slice(0, 10),
    };

    const post = await request("POST", "/api/concepts", newConcept);
    expect(post.status).toBe(200);
    expect(post.data.id).toBe(newConcept.id);

    const after = await request("GET", "/api/concepts");
    const found = after.data.find((c) => c.id === newConcept.id);
    expect(found).toBeDefined();
    expect(found.name).toBe(newConcept.name);

    const del = await request("DELETE", `/api/concepts/${newConcept.id}`);
    expect(del.status).toBe(200);
  });
});

runServerTests("Expenses API", () => {
  it("GET /api/expenses returns array", async () => {
    const res = await request("GET", "/api/expenses");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });

  it("POST /api/expenses creates and updates records", async () => {
    const expenses = await request("GET", "/api/expenses");
    const beforeCount = expenses.data.length;

    const newExpense = {
      conceptId: expenses.data[0]?.conceptId || "c1",
      description: "Test expense",
      amount: 100,
      paidBy: "Tester",
      source: "Out of pocket",
      date: new Date().toISOString().slice(0, 10),
    };

    const post = await request("POST", "/api/expenses", newExpense);
    expect(post.status).toBe(200);
    expect(post.data.id).toBeDefined();

    const after = await request("GET", "/api/expenses");
    expect(after.data.length).toBe(beforeCount + 1);

    const del = await request("DELETE", `/api/expenses/${post.data.id}`);
    expect(del.status).toBe(200);
  });
});

runServerTests("Delete cascade", () => {
  it("DELETE /api/concepts/:id removes linked expenses", async () => {
    const concepts = await request("GET", "/api/concepts");
    let target = concepts.data.find((c) => c.name === "Cascade Test");
    if (!target) {
      const newConcept = {
        id: "c-test-cascade",
        name: "Cascade Test",
        description: "",
        domain: "",
        patentStatus: "Not started",
        plannedOrgForPOC: "",
        status: "idea",
        eta: "",
        requiresSensor: "No",
        artifacts: [],
        createdAt: new Date().toISOString().slice(0, 10),
      };
      await request("POST", "/api/concepts", newConcept);
      target = newConcept;
    }

    const expensePayload = {
      conceptId: target.id,
      description: "Cascade expense",
      amount: 200,
      paidBy: "Tester",
      source: "Out of pocket",
      date: new Date().toISOString().slice(0, 10),
    };
    const expensePost = await request("POST", "/api/expenses", expensePayload);
    expect(expensePost.status).toBe(200);

    const del = await request("DELETE", `/api/concepts/${target.id}`);
    expect(del.status).toBe(200);

    const expenses = await request("GET", "/api/expenses");
    const remaining = expenses.data.filter((e) => e.conceptId === target.id);
    expect(remaining.length).toBe(0);
  });
});
