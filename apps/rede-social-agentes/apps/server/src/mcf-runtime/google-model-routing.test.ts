import { describe, expect, it } from 'vitest';

import {
  MCF_GOOGLE_MODEL_ROUTING_POLICY,
  recommendedMcfModel,
  selectMcfModel,
} from './google-model-routing.js';

const verified = [
  { name: 'models/gemini-3.8-flash', supportedGenerationMethods: ['generateContent'] },
  { name: 'models/gemini-3.8-live', supportedGenerationMethods: ['bidiGenerateContent'] },
  {
    name: 'models/gemini-3.8-live-extended-thinking',
    supportedGenerationMethods: ['bidiGenerateContent'],
  },
  { name: 'models/gemini-2.5-flash', supportedGenerationMethods: ['generateContent'] },
];

describe('MCF Google model-routing contract', () => {
  it('defaults to a recommendation without declaring unverified availability', () => {
    const decision = selectMcfModel('text_agent', null);
    expect(decision.policy).toBe(MCF_GOOGLE_MODEL_ROUTING_POLICY);
    expect(decision.requestedModel).toBe('gemini-3.8-flash');
    expect(decision.selectedModel).toBeNull();
    expect(decision.status).toBe('PENDING_VERIFICATION');
    expect(decision.toolsVerified).toBe(false);
    expect(decision.quotaCheckedAt).toBeNull();
  });

  it('selects verified Gemini 3.8 Flash only for text-capable API', () => {
    expect(selectMcfModel('text_agent', verified).selectedModel).toBe('gemini-3.8-flash');
    const voiceOnly = verified.filter((x) => x.name.includes('live'));
    expect(selectMcfModel('text_agent', voiceOnly).status).toBe('MODEL_NOT_AVAILABLE');
  });

  it('keeps voice and deep-thinking voice distinct', () => {
    expect(selectMcfModel('realtime_voice', verified).selectedModel).toBe('gemini-3.8-live');
    expect(selectMcfModel('thinking_voice', verified).selectedModel).toBe(
      'gemini-3.8-live-extended-thinking',
    );
    expect(recommendedMcfModel('realtime_voice')).not.toBe(recommendedMcfModel('thinking_voice'));
  });

  it('only uses an allowed fallback after verifying catalog support', () => {
    const fallback = selectMcfModel('text_agent', [
      { name: 'models/gemini-2.5-flash', supportedGenerationMethods: ['generateContent'] },
    ]);
    expect(fallback.selectedModel).toBe('gemini-2.5-flash');
    expect(fallback.fallbackReason).toBe('NOT_IN_VERIFIED_CATALOG');
    expect(fallback.quotaCheckedAt).toBeNull();
  });

  it('never treats catalog presence as proof of tool support or quota', () => {
    const d = selectMcfModel('thinking_voice', verified);
    expect(d.status).toBe('VERIFIED_CATALOG');
    expect(d.toolsVerified).toBe(false);
    expect(d.quotaCheckedAt).toBeNull();
  });

  it('rejects APIs incompatible with the requested modality', () => {
    const wrongMethod = [
      { name: 'models/gemini-3.8-live', supportedGenerationMethods: ['generateContent'] },
    ];
    expect(selectMcfModel('realtime_voice', wrongMethod).status).toBe('MODEL_NOT_AVAILABLE');
  });
});
