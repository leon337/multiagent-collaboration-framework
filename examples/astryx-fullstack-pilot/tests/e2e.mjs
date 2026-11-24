import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pgpng from "pngjs";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import pixelmatch from "pixelmatch";

const { PNG } = pgpng;
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const token = process.env.MCF_PILOT_TOKEN;
const baselinePath = join(root, "visual-baselines.json");
const artifactDir = join(root, "artifacts");
const env = { ...process.env, MCF_PILOT_TOKEN: token, API_PORT: "3001" };
let api;
let preview;
let browser;

async function waitFor(url, attempts = 50) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {}
    await delay(200);
  }
  throw new Error("Service did not become ready: " + url);
}

function start(command, args, cwd) {
  const child = spawn(command, args, {
    cwd,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let logs = "";
  child.stdout.on("data", (chunk) => {
    logs += chunk.toString();
  });
  child.stderr.on("data", (chunk) => {
    logs += chunk.toString();
  });
  child.logs = () => logs;
  return child;
}

function stop(child) {
  if (!child || child.exitCode !== null) return Promise.resolve();
  child.kill("SIGTERM");
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      resolve();
    }, 3000);
    child.once("exit", () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

async function compareScreenshot(name, screenshot, baselines) {
  const actual = PNG.sync.read(screenshot);
  if (process.env.UPDATE_VISUAL_BASELINES === "1") {
    baselines[name] = screenshot.toString("base64");
    return;
  }
  const encoded = baselines[name];
  if (typeof encoded !== "string")
    throw new Error("Missing visual baseline: " + name);
  const expected = PNG.sync.read(Buffer.from(encoded, "base64"));
  if (actual.width !== expected.width || actual.height !== expected.height) {
    throw new Error("Visual baseline dimensions changed for " + name);
  }
  const diff = new PNG({ width: actual.width, height: actual.height });
  const changedPixels = pixelmatch(
    expected.data,
    actual.data,
    diff.data,
    actual.width,
    actual.height,
    { threshold: 0.12 },
  );
  const ratio = changedPixels / (actual.width * actual.height);
  if (ratio > 0.005)
    throw new Error(
      "Visual regression for " +
        name +
        ": " +
        changedPixels +
        " changed pixels (" +
        (ratio * 100).toFixed(3) +
        "%)",
    );
}

try {
  if (!token || token.length < 24)
    throw new Error("MCF_PILOT_TOKEN is missing or too short.");
  await mkdir(artifactDir, { recursive: true });
  api = start(process.execPath, ["server.mjs"], root);
  await waitFor("http://127.0.0.1:3001/api/health");
  preview = start(
    process.execPath,
    [
      "node_modules/vite/bin/vite.js",
      "preview",
      "--host",
      "127.0.0.1",
      "--port",
      "4173",
      "--strictPort",
    ],
    root,
  );
  await waitFor("http://127.0.0.1:4173");

  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  await context.addInitScript(
    (value) => sessionStorage.setItem("mcf-pilot-token", value),
    token,
  );
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4173", { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Projeto-piloto Astryx" }).waitFor();
  await page.getByLabel("Título da tarefa").fill("MCF Astryx Pilot");
  await page.getByRole("button", { name: "Adicionar tarefa" }).click();
  await page
    .getByRole("list", { name: "Lista de tarefas" })
    .getByText("MCF Astryx Pilot")
    .waitFor();
  await page
    .getByRole("status")
    .getByText("Tarefa salva no banco de dados.")
    .waitFor();

  const unauthorized = await page.request.get(
    "http://127.0.0.1:3001/api/tasks",
  );
  if (unauthorized.status() !== 401)
    throw new Error(
      "Server-side authorization failed: expected 401, got " +
        unauthorized.status(),
    );
  const authorized = await page.request.get("http://127.0.0.1:3001/api/tasks", {
    headers: { Authorization: "Bearer " + token },
  });
  if (authorized.status() !== 200 || (await authorized.json()).length !== 1)
    throw new Error("Authenticated API/database round-trip failed.");

  const axe = await new AxeBuilder({ page }).analyze();
  if (axe.violations.length)
    throw new Error(
      "Accessibility violations: " +
        JSON.stringify(
          axe.violations.map((item) => ({
            id: item.id,
            impact: item.impact,
            nodes: item.nodes.length,
          })),
        ),
    );

  const baselines =
    process.env.UPDATE_VISUAL_BASELINES === "1"
      ? {}
      : JSON.parse(await readFile(baselinePath, "utf8"));
  const desktop = await page.screenshot({ fullPage: true });
  await writeFile(join(artifactDir, "desktop.png"), desktop);
  await compareScreenshot("desktop", desktop, baselines);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(150);
  const mobileOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  if (mobileOverflow) throw new Error("Mobile layout overflows horizontally.");
  const mobile = await page.screenshot({ fullPage: true });
  await writeFile(join(artifactDir, "mobile.png"), mobile);
  await compareScreenshot("mobile", mobile, baselines);

  if (process.env.UPDATE_VISUAL_BASELINES === "1") {
    await writeFile(baselinePath, JSON.stringify(baselines, null, 2) + "\n");
  }
  process.stdout.write(
    "ASTRYX_FULLSTACK_PILOT_PASS: React/Astryx + authenticated API + isolated PostgreSQL + migrations + desktop/mobile visual regression + axe accessibility.\n",
  );
} catch (error) {
  process.stderr.write((error.stack || error) + "\n");
  process.stderr.write(
    "API LOGS:\n" +
      (api?.logs?.() || "") +
      "\nPREVIEW LOGS:\n" +
      (preview?.logs?.() || "") +
      "\n",
  );
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  await stop(preview);
  await stop(api);
}
