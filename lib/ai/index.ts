import { aiConfig } from '@/lib/config';
import { MockAiProvider } from './mock';
import { OpenAiProvider } from './openai';
import { generateWithRetry, type RetryPolicy } from './orchestrator';
import type { AiProvider, EditorialResult } from './provider';

export type { EditorialResult } from './provider';
export { AiUnavailableError } from './provider';
export type { EditorialPayload } from './schema';

/**
 * Resolve providers from environment. Real mode requires CONTENT_AI_MODE=real
 * AND an API key; anything else uses the deterministic mock (no network).
 */
export function resolveProviders(): { primary: AiProvider; fallback: AiProvider | null } {
  if (aiConfig.mode === 'real' && aiConfig.apiKey) {
    return {
      primary: new OpenAiProvider(aiConfig.primaryModel, 'primary'),
      fallback: new OpenAiProvider(aiConfig.fallbackModel, 'fallback-model'),
    };
  }
  return { primary: new MockAiProvider(), fallback: null };
}

export function defaultRetryPolicy(): RetryPolicy {
  return {
    primaryAttempts: aiConfig.maxPrimaryAttempts,
    fallbackAttempts: aiConfig.maxFallbackAttempts,
    baseDelayMs: 1500,
  };
}

/** One-call entry point used by the generation pipeline. */
export async function generateEditorial(date: string, seed: string): Promise<EditorialResult> {
  const { primary, fallback } = resolveProviders();
  return generateWithRetry(primary, fallback, date, seed, defaultRetryPolicy());
}
