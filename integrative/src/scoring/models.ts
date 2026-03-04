import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import type { LanguageModel } from 'ai';

export type ModelId = 'haiku' | 'gemini-flash' | 'sonnet';

interface ModelConfig {
  id: ModelId;
  name: string;
  provider: () => LanguageModel;
  costPer1MTokens: number;
  description: string;
}

export const MODELS: Record<ModelId, ModelConfig> = {
  haiku: {
    id: 'haiku',
    name: 'Claude Haiku 4.5',
    provider: () => anthropic('claude-haiku-4-5-20251001'),
    costPer1MTokens: 1.0,
    description: 'Fast, high-quality scoring for real-time use',
  },
  'gemini-flash': {
    id: 'gemini-flash',
    name: 'Gemini Flash',
    provider: () => google('gemini-3-flash-preview'),
    costPer1MTokens: 0.15,
    description: 'Cost-effective for batch operations (6x cheaper)',
  },
  sonnet: {
    id: 'sonnet',
    name: 'Claude Sonnet 4.6',
    provider: () => anthropic('claude-sonnet-4-6'),
    costPer1MTokens: 3.0,
    description: 'High-quality analysis and reasoning',
  },
};

export function getModel(id: ModelId): ModelConfig {
  const config = MODELS[id];
  if (!config) throw new Error(`Unknown model: ${id}`);
  return config;
}
