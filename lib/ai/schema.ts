import { z } from 'zod';

/**
 * Contract for the AI editorial payload. Zod validates at runtime; the strict
 * JSON Schema below is sent to the OpenAI Responses API as a Structured
 * Outputs schema (all fields required, no additional properties).
 */

export const editorialWordSchema = z.object({
  word: z.string().min(2).max(24),
  clue: z.string().min(4).max(200),
  pos: z.enum(['subst', 'adj', 'verb', 'adv']),
});

export const editorialPayloadSchema = z.object({
  theme: z.object({
    slug: z.string().min(2).max(40),
    title: z.string().min(3).max(80),
    description: z.string().min(6).max(300),
  }),
  dailyTitle: z.string().min(3).max(90),
  dailyDescription: z.string().min(6).max(300),
  crosswordWords: z.array(editorialWordSchema).min(8).max(30),
  wordSearchWords: z.array(z.string().min(2).max(24)).min(8).max(24),
  anagramHints: z
    .array(z.object({ word: z.string().min(2).max(24), hint: z.string().min(2).max(120) }))
    .max(12),
  quickChallengeCandidates: z.array(z.string().min(4).max(12)).min(3).max(12),
});

export type EditorialPayload = z.infer<typeof editorialPayloadSchema>;

/** Strict JSON Schema (Structured Outputs) equivalent of the Zod schema. */
export const EDITORIAL_JSON_SCHEMA = {
  name: 'careu_editorial_payload',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: [
      'theme',
      'dailyTitle',
      'dailyDescription',
      'crosswordWords',
      'wordSearchWords',
      'anagramHints',
      'quickChallengeCandidates',
    ],
    properties: {
      theme: {
        type: 'object',
        additionalProperties: false,
        required: ['slug', 'title', 'description'],
        properties: {
          slug: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
        },
      },
      dailyTitle: { type: 'string' },
      dailyDescription: { type: 'string' },
      crosswordWords: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['word', 'clue', 'pos'],
          properties: {
            word: { type: 'string' },
            clue: { type: 'string' },
            pos: { type: 'string', enum: ['subst', 'adj', 'verb', 'adv'] },
          },
        },
      },
      wordSearchWords: { type: 'array', items: { type: 'string' } },
      anagramHints: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['word', 'hint'],
          properties: {
            word: { type: 'string' },
            hint: { type: 'string' },
          },
        },
      },
      quickChallengeCandidates: { type: 'array', items: { type: 'string' } },
    },
  },
} as const;
