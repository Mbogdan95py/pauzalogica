import { z } from 'zod';
import { gameSchema } from './games';
import { difficultySchema } from './common';

/**
 * The daily content package: one JSON file per calendar day, stored at
 * content/daily/YYYY-MM-DD.json. This is the single source of truth the site
 * renders from — no database, no runtime API.
 */

export const validationCheckSchema = z.object({
  stage: z.string(),
  passed: z.boolean(),
  detail: z.string().optional(),
});

export const validationSummarySchema = z.object({
  passed: z.boolean(),
  checks: z.array(validationCheckSchema),
  validatedAt: z.string(),
  validatorVersion: z.number().int(),
});

export const fallbackInfoSchema = z.object({
  /** true if any fallback path was taken while building the package. */
  used: z.boolean(),
  /** which AI stage failed, if any: 'primary' | 'fallback-model' | 'local'. */
  aiSource: z.enum(['primary', 'fallback-model', 'local-theme', 'none']),
  /** games that were swapped for an algorithmic backup. */
  swappedGames: z.array(z.string()),
  notes: z.array(z.string()),
});

export const dailyPackageSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  locale: z.string(),
  schemaVersion: z.number().int(),
  generatedAt: z.string(),
  generationModel: z.string(),
  seed: z.string(),
  theme: z.string(),
  title: z.string(),
  description: z.string(),
  games: z.array(gameSchema).min(6),
  fallbacks: fallbackInfoSchema,
  validation: validationSummarySchema,
  contentHash: z.string(),
});

export type DailyPackage = z.infer<typeof dailyPackageSchema>;
export type ValidationSummary = z.infer<typeof validationSummarySchema>;
export type ValidationCheck = z.infer<typeof validationCheckSchema>;
export type FallbackInfo = z.infer<typeof fallbackInfoSchema>;

/**
 * A lightweight index entry summarizing a package, used for archive listings
 * and the dedup archive without loading every full file.
 */
export const packageIndexEntrySchema = z.object({
  date: z.string(),
  title: z.string(),
  theme: z.string(),
  contentHash: z.string(),
  fallbackUsed: z.boolean(),
  games: z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      difficulty: difficultySchema,
    }),
  ),
});
export type PackageIndexEntry = z.infer<typeof packageIndexEntrySchema>;
