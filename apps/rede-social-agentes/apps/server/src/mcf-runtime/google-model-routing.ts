/**
 * MCF-GOOGLE-MODEL-ROUTING/v1 — pure, provider-neutral decision contract.
 *
 * Do not change a running agent provider solely because a model is recommended.
 * A model is selected only from a verified catalog for the requested method.
 * Quota and actual tool support must be tested by the execution adapter separately.
 */
export const MCF_GOOGLE_MODEL_ROUTING_POLICY = 'MCF-GOOGLE-MODEL-ROUTING/v1' as const;

export type McfModelTaskClass =
  | 'text_agent'
  | 'realtime_voice'
  | 'thinking_voice'
  | 'transcription'
  | 'translation';

export interface McfCatalogModel {
  name: string;
  supportedGenerationMethods: readonly string[];
}

export interface McfModelDecision {
  policy: typeof MCF_GOOGLE_MODEL_ROUTING_POLICY;
  taskClass: McfModelTaskClass;
  requestedModel: string;
  selectedModel: string | null;
  status: 'PENDING_VERIFICATION' | 'VERIFIED_CATALOG' | 'MODEL_NOT_AVAILABLE';
  /** Catalog presence is not proof of quota, function calling or a completed task. */
  endpointVerified: boolean;
  toolsVerified: false;
  quotaCheckedAt: null;
  fallbackReason: 'NOT_IN_VERIFIED_CATALOG' | null;
}

const PREFERENCES: Readonly<Record<McfModelTaskClass, readonly string[]>> = {
  text_agent: ['gemini-3.8-flash', 'gemini-3.1-pro-preview', 'gemini-2.5-flash'],
  realtime_voice: ['gemini-3.8-live'],
  thinking_voice: ['gemini-3.8-live-extended-thinking'],
  transcription: ['gemini-3.5-transcribe-live'],
  translation: ['gemini-3.5-live-translate-preview'],
};

const METHODS: Readonly<Record<McfModelTaskClass, string>> = {
  text_agent: 'generateContent',
  realtime_voice: 'bidiGenerateContent',
  thinking_voice: 'bidiGenerateContent',
  transcription: 'bidiGenerateContent',
  translation: 'bidiGenerateContent',
};

export function recommendedMcfModel(taskClass: McfModelTaskClass): string {
  return PREFERENCES[taskClass][0]!;
}

/** Null catalog means no provider verification; never imply a model works. */
export function selectMcfModel(
  taskClass: McfModelTaskClass,
  catalog: readonly McfCatalogModel[] | null,
): McfModelDecision {
  const requestedModel = recommendedMcfModel(taskClass);
  if (!catalog) {
    return {
      policy: MCF_GOOGLE_MODEL_ROUTING_POLICY,
      taskClass,
      requestedModel,
      selectedModel: null,
      status: 'PENDING_VERIFICATION',
      endpointVerified: false,
      toolsVerified: false,
      quotaCheckedAt: null,
      fallbackReason: null,
    };
  }

  const supported = new Set(
    catalog
      .filter((item) => item.supportedGenerationMethods.includes(METHODS[taskClass]))
      .map((item) => item.name.replace(/^models\//, '')),
  );
  const selectedModel = PREFERENCES[taskClass].find((id) => supported.has(id)) ?? null;
  return {
    policy: MCF_GOOGLE_MODEL_ROUTING_POLICY,
    taskClass,
    requestedModel,
    selectedModel,
    status: selectedModel ? 'VERIFIED_CATALOG' : 'MODEL_NOT_AVAILABLE',
    endpointVerified: !!selectedModel,
    toolsVerified: false,
    quotaCheckedAt: null,
    fallbackReason: selectedModel && selectedModel !== requestedModel ? 'NOT_IN_VERIFIED_CATALOG' : null,
  };
}
