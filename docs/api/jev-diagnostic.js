import { experimental_evaluate as evaluate } from 'ai';

const MODEL = 'typesafe-ai/jev';
const state = {
  agent: 'MESTRE',
  mission: 'Diagnóstico sintético Jev',
  tests: 'passed',
  ci: 'green',
  production: false,
  externalWrite: false,
  errors: 0
};

const baseQuestions = {
  missionCompleted: {
    type: 'boolean',
    instructions: 'A missão pode ser considerada concluída com evidência suficiente?'
  },
  nextAction: {
    type: 'choice',
    instructions: 'Selecione a próxima ação operacional mais apropriada.',
    criteria: {
      continue: 'Continuar com segurança.',
      retry: 'Repetir ou revalidar.',
      request_human: 'Solicitar revisão humana.',
      stop: 'Interromper.'
    }
  }
};

const withBooleanCriteria = {
  ...baseQuestions,
  requiresHumanGate: {
    type: 'boolean',
    instructions: 'É necessária autorização humana?',
    criteria: {
      true: 'Ação material exige autoridade humana.',
      false: 'Ação reversível e não material.'
    }
  }
};

const scoreOnly = {
  operationalRiskScore: {
    type: 'score',
    instructions: 'Avalie o risco operacional total, do menor para o maior.',
    criteria: ['mínimo', 'baixo', 'médio', 'alto', 'crítico']
  }
};

const fullQuestions = {
  ...withBooleanCriteria,
  risk: {
    type: 'choice',
    instructions: 'Classifique o risco operacional.',
    criteria: {
      low: 'Baixo e reversível.',
      medium: 'Impacto limitado.',
      high: 'Impacto material.',
      critical: 'Produção, credenciais ou irreversibilidade.'
    }
  },
  ...scoreOnly
};

function serializeError(error) {
  const out = {
    name: error?.name ?? null,
    message: error instanceof Error ? error.message : String(error),
    statusCode: error?.statusCode ?? error?.status ?? null,
    url: error?.url ?? null,
    responseBody: error?.responseBody ?? error?.data ?? null
  };
  if (error?.cause) {
    out.cause = {
      name: error.cause?.name ?? null,
      message: error.cause?.message ?? String(error.cause),
      statusCode: error.cause?.statusCode ?? error.cause?.status ?? null,
      responseBody: error.cause?.responseBody ?? error.cause?.data ?? null
    };
  }
  return out;
}

async function probe(name, questions, providerOptions) {
  const started = Date.now();
  try {
    const result = await evaluate({ model: MODEL, state, questions, ...(providerOptions ? { providerOptions } : {}) });
    return {
      name,
      ok: true,
      latencyMs: Date.now() - started,
      answers: result.answers,
      usage: result.usage ?? null,
      providerMetadata: result.providerMetadata ?? null
    };
  } catch (error) {
    return { name, ok: false, latencyMs: Date.now() - started, error: serializeError(error) };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }

  const probes = [];
  probes.push(await probe('01-baseline', baseQuestions));
  probes.push(await probe('02-boolean-criteria', withBooleanCriteria));
  probes.push(await probe('03-score-only', scoreOnly));
  probes.push(await probe('04-baseline-zdr', baseQuestions, { gateway: { zeroDataRetention: true } }));
  probes.push(await probe('05-full', fullQuestions, { gateway: { zeroDataRetention: true } }));

  return res.status(200).json({
    ok: probes.every(p => p.ok),
    model: MODEL,
    diagnostic: 'JEV-FEATURE-MATRIX-001',
    probes
  });
}
