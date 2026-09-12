import type { GeminiClient, GeminiClientResponse } from './gemini-model.provider.js';

interface GoogleGenAiInstance {
  models: {
    generateContent(params: {
      model: string;
      contents: unknown;
      config: { automaticFunctionCalling: { disable: boolean } };
    }): Promise<GeminiClientResponse>;
  };
}

interface GoogleGenAiModule {
  GoogleGenAI: new (options: { apiKey: string }) => GoogleGenAiInstance;
}

export type GoogleGenAiModuleLoader = () => Promise<GoogleGenAiModule>;

async function defaultLoader(): Promise<GoogleGenAiModule> {
  const moduleName = '@google/genai';
  return (await import(moduleName)) as unknown as GoogleGenAiModule;
}

export async function createGoogleGenAiClient(
  apiKey: string,
  loadSdk: GoogleGenAiModuleLoader = defaultLoader,
): Promise<GeminiClient> {
  if (apiKey.trim().length === 0) throw new Error('Google Gen AI API key is required');
  const { GoogleGenAI } = await loadSdk();
  const ai = new GoogleGenAI({ apiKey });

  return {
    async generateContent(request) {
      return ai.models.generateContent({
        model: request.model,
        contents: request.contents,
        config: {
          automaticFunctionCalling: {
            disable: request.disableAutomaticFunctionCalling,
          },
        },
      });
    },
  };
}
