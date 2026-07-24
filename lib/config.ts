import { DEFAULT_TZ } from './date';

/**
 * Central config resolved from environment variables. Only the generation
 * script reads the AI secrets; the web bundle sees nothing but public values.
 */

function bool(value: string | undefined, fallback = false): boolean {
  if (value == null || value === '') return fallback;
  return /^(1|true|yes|on)$/i.test(value);
}

function int(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export const aiConfig = {
  /** 'mock' (default) never touches the network; 'real' calls OpenAI. */
  mode: (process.env.CONTENT_AI_MODE === 'real' ? 'real' : 'mock') as 'real' | 'mock',
  apiKey: process.env.OPENAI_API_KEY ?? '',
  primaryModel: process.env.OPENAI_PRIMARY_MODEL || 'gpt-5.6-luna',
  fallbackModel: process.env.OPENAI_FALLBACK_MODEL || 'gpt-5.6-terra',
  maxPrimaryAttempts: int(process.env.OPENAI_MAX_PRIMARY_ATTEMPTS, 3),
  maxFallbackAttempts: int(process.env.OPENAI_MAX_FALLBACK_ATTEMPTS, 2),
  requestTimeoutMs: int(process.env.OPENAI_TIMEOUT_MS, 45_000),
  maxOutputTokens: int(process.env.OPENAI_MAX_OUTPUT_TOKENS, 4_000),
  saveRaw: bool(process.env.CONTENT_SAVE_RAW, false) && process.env.NODE_ENV !== 'production',
};

export const contentConfig = {
  timezone: process.env.CONTENT_TZ || DEFAULT_TZ,
  lookaheadDays: int(process.env.CONTENT_LOOKAHEAD_DAYS, 14),
  generationSecret: process.env.CONTENT_GENERATION_SECRET ?? '',
};

export const adsConfig = {
  enabled: bool(process.env.NEXT_PUBLIC_ADS_ENABLED, false),
  client: process.env.NEXT_PUBLIC_AD_CLIENT ?? '',
  slots: {
    leaderboard: process.env.NEXT_PUBLIC_AD_SLOT_LEADERBOARD ?? '',
    rectangle: process.env.NEXT_PUBLIC_AD_SLOT_RECTANGLE ?? '',
    inContent: process.env.NEXT_PUBLIC_AD_SLOT_INCONTENT ?? '',
    mobile: process.env.NEXT_PUBLIC_AD_SLOT_MOBILE ?? '',
  },
};

export const siteConfig = {
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://careu.ro',
  name: 'Careu.ro',
  tagline: 'Jocuri zilnice de logică și cuvinte',
};

/** Approximate USD price per 1M tokens, used only for cost estimation logs. */
export const MODEL_PRICING: Record<string, { inputPerM: number; outputPerM: number }> = {
  'gpt-5.6-luna': { inputPerM: 2.5, outputPerM: 10 },
  'gpt-5.6-terra': { inputPerM: 1.0, outputPerM: 4 },
};
