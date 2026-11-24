import { createServer } from "node:http";
import { randomUUID, timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Pool } = pg;
const root = dirname(fileURLToPath(import.meta.url));
const databaseUrl = process.env.DATABASE_URL;
const token = process.env.MCF_PILOT_TOKEN;
const port = Number(process.env.API_PORT || 3001);
const allowedOrigin = "http://127.0.0.1:4173";

if (!databaseUrl || !token || token.length < 24) {
  throw new Error(
    "DATABASE_URL and a test-only MCF_PILOT_TOKEN of at least 24 characters are required.",
  );
}

const pool = new Pool({
  connectionString: databaseUrl,
  max: 3,
  application_name: "mcf-astryx-fullstack-pilot",
});
const schema = "mcf_pilot_" + randomUUID().replaceAll("-", "");
const identifier = '"' + schema + '"';
let server;

async function migrate() {
  await pool.query("CREATE SCHEMA " + identifier);
  const migration = await readFile(
    join(root, "migrations", "001_create_tasks.sql"),
    "utf8",
  );
  await pool.query(migration.replaceAll("__PILOT_SCHEMA__", schema));
}

function authorized(request) {
  const value = request.headers.authorization || "";
  if (!value.startsWith("Bearer ")) return false;
  const provided = Buffer.from(value.slice(7));
  const expected = Buffer.from(token);
  return (
    provided.length === expected.length && timingSafeEqual(provided, expected)
  );
}

function send(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Access-Control-Allow-Origin": allowedOrigin,
    Vary: "Origin",
  });
  response.end(JSON.stringify(payload));
}

async function readJson(request) {
  let raw = "";
  for await (const chunk of request) {
    raw += chunk;
    if (Buffer.byteLength(raw) > 8192)
      throw Object.assign(new Error("Payload too large"), { statusCode: 413 });
  }
  try {
    return JSON.parse(raw || "{}");
  } catch {
    throw Object.assign(new Error("Invalid JSON"), { statusCode: 400 });
  }
}

async function handler(request, response) {
  if (request.headers.origin && request.headers.origin !== allowedOrigin)
    return send(response, 403, { error: "origin_not_allowed" });
  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      Vary: "Origin",
    });
    return response.end();
  }

  const url = new URL(request.url || "/", "http://127.0.0.1");
  if (request.method === "GET" && url.pathname === "/api/health")
    return send(response, 200, { status: "ok" });
  if (
    !["GET", "POST"].includes(request.method || "") ||
    url.pathname !== "/api/tasks"
  )
    return send(response, 404, { error: "not_found" });
  if (!authorized(request))
    return send(response, 401, { error: "unauthorized" });

  try {
    if (request.method === "GET") {
      const result = await pool.query(
        "SELECT id, title, created_at FROM " +
          identifier +
          ".tasks ORDER BY id ASC",
      );
      return send(
        response,
        200,
        result.rows.map((row) => ({ id: row.id, title: row.title })),
      );
    }
    const body = await readJson(request);
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title || title.length > 120)
      return send(response, 400, { error: "invalid_title" });
    const result = await pool.query(
      "INSERT INTO " +
        identifier +
        ".tasks (title) VALUES ($1) RETURNING id, title",
      [title],
    );
    return send(response, 201, {
      id: result.rows[0].id,
      title: result.rows[0].title,
    });
  } catch (error) {
    return send(response, error.statusCode || 500, {
      error: error.statusCode ? error.message : "internal_error",
    });
  }
}

async function shutdown() {
  if (server) await new Promise((resolve) => server.close(resolve));
  try {
    await pool.query("DROP SCHEMA IF EXISTS " + identifier + " CASCADE");
  } catch {}
  await pool.end();
}

await migrate();
server = createServer((request, response) => {
  void handler(request, response);
});
server.listen(port, "127.0.0.1", () => {
  process.stdout.write("MCF_ASTRYX_PILOT_READY " + port + " " + schema + "\n");
});
process.once("SIGTERM", () => {
  void shutdown().finally(() => process.exit(0));
});
process.once("SIGINT", () => {
  void shutdown().finally(() => process.exit(0));
});
