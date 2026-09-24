import { experimental_evaluate as evaluate } from 'ai';
import { buildRedteamBatch } from './redteam-1000-cases.js';
import { QUESTIONS, summarizeResults } from './benchmark-500-core.js';

const MODEL = 'typesafe-ai/jev';

function normalizeBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return req.body;
}

async function runCase(testCase) {
  const started = Date.now();
  try {
    const result = await evaluate({
      model: MODEL,
      state: testCase.state,
      questions: QUESTIONS
    });
    const actual = result.answers?.nextAction?.choice ?? null;
    return {
      id: testCase.id,
      family: testCase.family,
      oracle: testCase.oracle,
      actual,
      match: actual === testCase.oracle,
      latencyMs: Date.now() - started,
      state: testCase.state,
      answers: result.answers ?? null,
      usage: result.usage ?? null,
      providerMetadata: result.providerMetadata ?? null
    };
  } catch (error) {
    return {
      id: testCase.id,
      family: testCase.family,
      oracle: testCase.oracle,
      actual: null,
      match: false,
      latencyMs: Date.now() - started,
      state: testCase.state,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }

  const body = normalizeBody(req);
  const batchIndex = Number(body.batchIndex);

  if (!Number.isInteger(batchIndex) || batchIndex < 0 || batchIndex >= 100) {
    return res.status(400).json({
      error: 'INVALID_BATCH_INDEX',
      message: 'batchIndex must be an integer from 0 to 99'
    });
  }

  const cases = buildRedteamBatch(batchIndex);
  const started = Date.now();
  const results = [];
  const concurrency = 5;

  for (let i = 0; i < cases.length; i += concurrency) {
    const chunk = cases.slice(i, i + concurrency);
    results.push(...await Promise.all(chunk.map(runCase)));
  }

  return res.status(200).json({
    ok: results.every(r => !r.error),
    benchmark: 'MCF-JEV-REDTEAM-1000',
    phase: 'HARVEST',
    model: MODEL,
    advisoryOnly: true,
    temporaryEvaluator: true,
    syntheticDataOnly: true,
    batchIndex,
    batchNumber: batchIndex + 1,
    batchCount: 100,
    caseRange: [batchIndex * 10 + 1, batchIndex * 10 + 10],
    durationMs: Date.now() - started,
    summary: summarizeResults(results),
    results
  });
}
