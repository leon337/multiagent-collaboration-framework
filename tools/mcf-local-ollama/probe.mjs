import { createHash, randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";

const BASE = "http://127.0.0.1:11434";
const MODEL = "qwen3.5:4b";
export const MISSION_ID = "MCF-LOCAL-OLLAMA-QWEN35-20261115";

export async function health(fetchImpl = fetch) {
  const response = await fetchImpl(`${BASE}/api/tags`, {
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error(`Ollama health HTTP ${response.status}`);
  const data = await response.json();
  if (!data || !Array.isArray(data.models))
    throw new Error("Invalid Ollama model list");
  return {
    status: data.models.some((item) => item?.name === MODEL)
      ? "READY"
      : "MODEL_MISSING",
    model: MODEL,
    host: BASE,
    externalEffects: false,
  };
}

export async function infer(prompt, fetchImpl = fetch) {
  if (typeof prompt !== "string" || !prompt.trim() || prompt.length > 8000)
    throw new Error("Prompt must be 1..8000 characters");
  const traceId = randomUUID();
  const response = await fetchImpl(`${BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      stream: false,
      think: false,
      options: { num_ctx: 4096, num_predict: 128 },
    }),
    signal: AbortSignal.timeout(120000),
  });
  if (!response.ok) throw new Error(`Ollama inference HTTP ${response.status}`);
  const result = await response.json();
  if (
    !result ||
    typeof result.message?.content !== "string" ||
    !result.message.content.trim() ||
    result.message.content.length > 16000
  )
    throw new Error("Ollama inference returned invalid output");
  const output = result.message.content;
  return {
    schema: "mcf-local-inference-receipt/v1",
    missionId: MISSION_ID,
    traceId,
    model: MODEL,
    lifecycle: "COMPLETED",
    effectState: "NONE_OBSERVED",
    output,
    sha256: createHash("sha256").update(output).digest("hex"),
    tokens: result.eval_count ?? null,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const command = process.argv[2] ?? "health";
  try {
    if (command === "health") {
      console.log(JSON.stringify(await health(), null, 2));
    } else if (command === "infer") {
      const prompt =
        process.argv.slice(3).join(" ") ||
        "Responda em português, em uma frase: o que é o MCF?";
      console.log(JSON.stringify(await infer(prompt), null, 2));
    } else {
      throw new Error("Allowed commands: health | infer [prompt]");
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
