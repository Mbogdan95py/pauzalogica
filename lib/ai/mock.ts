import { createRng } from '@/lib/rng';
import { LOCAL_THEMES, localThemeWords } from '@/lib/dictionary/local-themes';
import { DEFINITIONS } from '@/lib/dictionary/definitions.data';
import { pool } from '@/lib/dictionary';
import { editorialPayloadSchema, type EditorialPayload } from './schema';
import type { AiProvider, EditorialResult } from './provider';

/**
 * Deterministic mock AI provider. Produces schema-valid editorial payloads from
 * the local dictionary — no network, stable per seed. Used in development,
 * tests and demo-content generation so we never burn API calls.
 *
 * Optional failure injection (for retry/fallback tests): construct with
 * `failTimes > 0` and the first N calls will throw.
 */
export class MockAiProvider implements AiProvider {
  readonly name = 'mock';
  private failuresLeft: number;

  constructor(options: { failTimes?: number } = {}) {
    this.failuresLeft = options.failTimes ?? 0;
  }

  async generateEditorial(_date: string, seed: string): Promise<EditorialResult> {
    const started = Date.now();
    if (this.failuresLeft > 0) {
      this.failuresLeft--;
      throw new Error('mock AI: injected failure');
    }

    const rng = createRng(`${seed}:mock-editorial`);
    const theme = rng.pick(LOCAL_THEMES);
    const themeWords = localThemeWords(theme.slug);

    // Crossword words: prefer theme words that have a local clue; top up from
    // the global defined-word pool if the theme is small.
    const withClue = themeWords.filter((w) => DEFINITIONS[w.normalized]);
    const globalWithClue = pool({ minLength: 3, maxLength: 10 }).filter(
      (w) => DEFINITIONS[w.normalized],
    );
    const crosswordSource = [...withClue];
    for (const w of rng.shuffled(globalWithClue)) {
      if (crosswordSource.length >= 20) break;
      if (!crosswordSource.some((x) => x.normalized === w.normalized)) crosswordSource.push(w);
    }

    const crosswordWords = crosswordSource.slice(0, 20).map((w) => ({
      word: w.display,
      clue: DEFINITIONS[w.normalized]!,
      pos: (w.pos === 'subst' || w.pos === 'adj' || w.pos === 'verb' || w.pos === 'adv'
        ? w.pos
        : 'subst') as 'subst' | 'adj' | 'verb' | 'adv',
    }));

    // Word-search words: any theme words 4–12 letters (top up globally).
    let wsWords = themeWords.filter((w) => w.length >= 4 && w.length <= 12).map((w) => w.display);
    if (wsWords.length < 12) {
      for (const w of rng.shuffled(pool({ minLength: 4, maxLength: 12, minFreq: 3 }))) {
        if (wsWords.length >= 14) break;
        if (!wsWords.includes(w.display)) wsWords.push(w.display);
      }
    }
    wsWords = wsWords.slice(0, 16);

    const anagramHints = wsWords.slice(0, 6).map((w) => ({
      word: w,
      hint: `Legat de tema „${theme.title.toLowerCase()}”.`,
    }));

    const quick = rng
      .sample(pool({ minLength: 5, maxLength: 8, minFreq: 4 }), 8)
      .map((w) => w.display);

    const payload: EditorialPayload = editorialPayloadSchema.parse({
      theme: { slug: theme.slug, title: theme.title, description: theme.description },
      dailyTitle: `${theme.title} — provocările zilei`,
      dailyDescription: `${theme.description} Șase jocuri noi te așteaptă astăzi.`,
      crosswordWords,
      wordSearchWords: wsWords,
      anagramHints,
      quickChallengeCandidates: quick,
    });

    return {
      payload,
      model: 'mock-local',
      source: 'mock',
      attempts: 1,
      inputTokens: 0,
      outputTokens: 0,
      estimatedCostUsd: 0,
      durationMs: Date.now() - started,
    };
  }
}
