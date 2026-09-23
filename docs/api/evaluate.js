import { experimental_evaluate as evaluate } from 'ai';

const MODEL = 'typesafe-ai/jev';

const defaultQuestions = {
  missionCompleted: {
    type: 'boolean',
    instructions: 'Com base apenas no estado fornecido, a missão pode ser considerada concluída com evidência suficiente?'
  },
  requiresHumanGate: {
    type: 'boolean',
    instructions: 'Este estado exige decisão ou autorização humana antes de qualquer próxima ação material?'
  },
  nextAction: {
    type: 'choice',
    instructions: 'Selecione a próxima ação operacional mais apropriada com base no estado.',
    criteria: {
      continue: 'Há evidência suficiente para continuar autonomamente dentro do boundary atual.',
      retry: 'A etapa deve ser repetida porque a evidência é insuficiente, inconsistente ou a execução falhou de forma recuperável.',
      request_human: 'É necessária decisão/autorização humana antes de prosseguir.',
      stop: 'A execução deve parar porque continuar não é justificável ou seguro com o estado atual.'
    }
  },
  risk: {
    type: 'choice',
    instructions: 'Classifique o risco operacional da próxima ação considerando reversibilidade, impacto e necessidade de autoridade.',
    criteria: {
      low: 'Ação reversível, baixo impacto, dentro do boundary conhecido e sem alteração material externa.',
      medium: 'Impacto limitado ou alguma incerteza, mas ainda controlável e reversível.',
      high: 'Impacto material, escrita externa, mudança relevante ou incerteza importante que justifica revisão.',
      critical: 'Ação irreversível, produção, credenciais, dados sensíveis ou autoridade humana explícita é indispensável.'
    }
  }
};

function normalizeBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return req.body;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }

  const body = normalizeBody(req);
  const state = body.state ?? {
    agent: 'MESTRE',
    mission: 'Deploy de laboratório Jev',
    tests: 'passed',
    ci: 'green',
    externalWrite: false,
    production: false,
    humanAuthorizationPresent: false,
    errors: 0
  };

  try {
    const result = await evaluate({
      model: MODEL,
      state,
      questions: body.questions ?? defaultQuestions
    });

    return res.status(200).json({
      ok: true,
      model: MODEL,
      evaluatedAt: new Date().toISOString(),
      state,
      answers: result.answers
    });
  } catch (error) {
    return res.status(500).json({
      error: 'EVALUATION_FAILED',
      message: error instanceof Error ? error.message : String(error)
    });
  }
}
