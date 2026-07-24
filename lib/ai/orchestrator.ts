import { createLogger } from '@/lib/log';
import type { AiProvider, EditorialResult } from './provider';
import { AiUnavailableError } from './provider';

const log = createLogger({ component: 'ai-orchestrator' });

export interface RetryPolicy {
  primaryAttempts: number;
  fallbackAttempts: number;
  /** base backoff delay in ms (doubles each retry) */
  baseDelayMs: number;
  /** injectable sleep for tests */
  sleep?: (ms: number) => Promise<void>;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Try the primary provider up to N times with exponential backoff, then the
 * fallback provider up to M times. Stops immediately on the first valid result
 * (no extra calls). Throws AiUnavailableError when everything failed — the
 * content pipeline then switches to the local-theme fallback.
 */
export async function generateWithRetry(
  primary: AiProvider,
  fallback: AiProvider | null,
  date: string,
  seed: string,
  policy: RetryPolicy,
): Promise<EditorialResult> {
  const sleep = policy.sleep ?? defaultSleep;
  let totalAttempts = 0;
  const errors: string[] = [];

  const tryProvider = async (
    provider: AiProvider,
    attempts: number,
    source: 'primary' | 'fallback-model',
  ): Promise<EditorialResult | null> => {
    for (let attempt = 1; attempt <= attempts; attempt++) {
      totalAttempts++;
      try {
        log.info('ai attempt start', { provider: provider.name, source, attempt, date });
        const result = await provider.generateEditorial(date, seed);
        return { ...result, source: result.source === 'mock' ? result.source : source, attempts: totalAttempts };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        errors.push(`${provider.name}#${attempt}: ${message}`);
        log.warn('ai attempt failed', { provider: provider.name, source, attempt, reason: message });
        if (attempt < attempts) {
          const delay = policy.baseDelayMs * 2 ** (attempt - 1);
          await sleep(delay);
        }
      }
    }
    return null;
  };

  const fromPrimary = await tryProvider(primary, policy.primaryAttempts, 'primary');
  if (fromPrimary) return fromPrimary;

  if (fallback) {
    const fromFallback = await tryProvider(fallback, policy.fallbackAttempts, 'fallback-model');
    if (fromFallback) return fromFallback;
  }

  throw new AiUnavailableError(`AI editorial generation failed after ${totalAttempts} attempts`, errors);
}
