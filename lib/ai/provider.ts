import type { EditorialPayload } from './schema';

/** Result of one editorial generation attempt (with accounting metadata). */
export interface EditorialResult {
  payload: EditorialPayload;
  model: string;
  /** which configured slot produced it */
  source: 'primary' | 'fallback-model' | 'mock';
  attempts: number;
  inputTokens: number;
  outputTokens: number;
  /** approximate cost in USD (0 for mock) */
  estimatedCostUsd: number;
  durationMs: number;
}

export interface AiProvider {
  readonly name: string;
  /**
   * Generate the editorial payload for a date. Implementations must validate
   * against the Zod schema and throw on failure — the caller orchestrates
   * retries and model fallback.
   */
  generateEditorial(date: string, seed: string): Promise<EditorialResult>;
}

export class AiUnavailableError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = 'AiUnavailableError';
  }
}
