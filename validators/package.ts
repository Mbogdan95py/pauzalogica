import { dailyPackageSchema, type DailyPackage, type ValidationCheck } from '@/lib/schema/pack';
import { DIFFICULTIES, CORE_HOME_GAME_TYPES } from '@/lib/schema/common';
import { hashObject } from '@/lib/hash';
import { normalizeForGrid, fixRomanianDiacritics } from '@/lib/text/diacritics';
import { has as inDictionary } from '@/lib/dictionary';
import { isBannedWord, containsBannedSubstring } from '@/lib/dictionary/blacklist.data';
import { validateGame } from './game';
import type { ValidatorResult } from './types';
import { fingerprintGame } from '@/lib/content/fingerprint';
import { renderPackageText } from '@/lib/content/render-check';
import { isConflict, type DedupIndex } from '@/lib/storage/dedup';

export const VALIDATOR_VERSION = 1;

export interface PackageValidationOutcome {
  passed: boolean;
  checks: ValidationCheck[];
  gameResults: Map<string, ValidatorResult>;
}

interface StageContext {
  pkg: DailyPackage;
  dedupIndex: DedupIndex | null;
  gameResults: Map<string, ValidatorResult>;
}

type Stage = { name: string; run(ctx: StageContext): { passed: boolean; detail?: string } };

/** Every display string a package exposes to players (for text-level checks). */
function collectTexts(pkg: DailyPackage): string[] {
  const texts: string[] = [pkg.title, pkg.description, pkg.theme];
  for (const g of pkg.games) {
    texts.push(g.title, g.description, g.instructions, ...g.hints);
    if (g.type === 'rebus' || g.type === 'careu' || g.type === 'integrame') {
      for (const e of g.puzzle.entries) texts.push(e.clue, e.answer);
    }
    if (g.type === 'cuvinte-ascunse') for (const w of g.puzzle.words) texts.push(w.display);
    if (g.type === 'anagrame') texts.push(...g.solution.answers);
    if (g.type === 'provocare-rapida') texts.push(g.solution.answer);
    if (g.type === 'cuvant-misterios') texts.push(g.solution.answer, g.puzzle.category);
  }
  return texts;
}

/** All dictionary-checkable answer words in the package. */
function collectAnswerWords(pkg: DailyPackage): string[] {
  const words: string[] = [];
  for (const g of pkg.games) {
    if (g.type === 'rebus' || g.type === 'careu' || g.type === 'integrame')
      words.push(...g.puzzle.entries.map((e) => e.answer));
    if (g.type === 'cuvinte-ascunse') words.push(...g.puzzle.words.map((w) => w.display));
    if (g.type === 'anagrame') words.push(...g.solution.answers);
    if (g.type === 'provocare-rapida') words.push(g.solution.answer);
    if (g.type === 'cuvant-misterios') words.push(g.solution.answer);
  }
  return words;
}

const STAGES: Stage[] = [
  {
    name: '01-structura-json',
    run({ pkg }) {
      try {
        const round = JSON.parse(JSON.stringify(pkg)) as unknown;
        if (typeof round !== 'object' || round === null) return { passed: false, detail: 'nu este obiect' };
        return { passed: true };
      } catch (e) {
        return { passed: false, detail: e instanceof Error ? e.message : 'serializare eșuată' };
      }
    },
  },
  {
    name: '02-schema-zod',
    run({ pkg }) {
      const res = dailyPackageSchema.safeParse(pkg);
      return res.success
        ? { passed: true }
        : { passed: false, detail: res.error.issues.slice(0, 3).map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') };
    },
  },
  {
    name: '03-ortografie',
    run({ pkg }) {
      const bad: string[] = [];
      for (const t of collectTexts(pkg)) {
        if (/[şŞţŢ]/.test(t)) bad.push(`sedilă în „${t.slice(0, 30)}”`);
        if (fixRomanianDiacritics(t).trim().length === 0) bad.push('text gol');
        if (/\s{2,}/.test(t)) bad.push(`spații duble în „${t.slice(0, 30)}”`);
      }
      return bad.length ? { passed: false, detail: bad.slice(0, 3).join('; ') } : { passed: true };
    },
  },
  {
    name: '04-dictionar',
    run({ pkg }) {
      const missing = collectAnswerWords(pkg).filter((w) => !inDictionary(w));
      return missing.length
        ? { passed: false, detail: `lipsesc din dicționar: ${missing.slice(0, 5).join(', ')}` }
        : { passed: true };
    },
  },
  {
    name: '05-duplicate-in-pachet',
    run({ pkg }) {
      const ids = new Set<string>();
      for (const g of pkg.games) {
        if (ids.has(g.id)) return { passed: false, detail: `id duplicat: ${g.id}` };
        ids.add(g.id);
      }
      // The same answer must not appear in two different crossword-family games.
      const crosswordAnswers = new Map<string, string>();
      for (const g of pkg.games) {
        if (g.type === 'rebus' || g.type === 'careu' || g.type === 'integrame') {
          for (const e of g.puzzle.entries) {
            const n = normalizeForGrid(e.answer);
            const prev = crosswordAnswers.get(n);
            if (prev && prev !== g.id)
              return { passed: false, detail: `răspuns repetat între careuri: ${e.answer}` };
            crosswordAnswers.set(n, g.id);
          }
        }
      }
      return { passed: true };
    },
  },
  {
    name: '06-cuvinte-interzise',
    run({ pkg }) {
      for (const t of collectTexts(pkg)) {
        const n = normalizeForGrid(t);
        if (isBannedWord(n) || containsBannedSubstring(n))
          return { passed: false, detail: `conținut nepermis: „${t.slice(0, 20)}”` };
      }
      return { passed: true };
    },
  },
  {
    name: '07-lungimi',
    run({ pkg }) {
      for (const g of pkg.games) {
        if (g.type === 'rebus' || g.type === 'careu' || g.type === 'integrame') {
          for (const e of g.puzzle.entries)
            if (normalizeForGrid(e.answer).length !== e.length)
              return { passed: false, detail: `lungime greșită: ${e.answer}` };
        }
        if (g.type === 'provocare-rapida' && normalizeForGrid(g.solution.answer).length !== g.puzzle.length)
          return { passed: false, detail: 'lungimea cuvântului zilei nu corespunde' };
        if (g.type === 'cuvant-misterios' && normalizeForGrid(g.solution.answer).length !== g.puzzle.length)
          return { passed: false, detail: 'lungimea cuvântului misterios nu corespunde' };
        if (g.type === 'anagrame') {
          for (let i = 0; i < g.puzzle.items.length; i++)
            if (g.puzzle.items[i]!.scrambled.length !== g.puzzle.items[i]!.length)
              return { passed: false, detail: `anagrama ${i + 1} are lungime declarată greșită` };
        }
      }
      return { passed: true };
    },
  },
  // Stages 08–10 are implemented in `dynamicStages` inside validatePackage
  // (they need the cached per-game validator results).
  { name: '08-intersectii', run: () => ({ passed: true }) },
  { name: '09-solver-independent', run: () => ({ passed: true }) },
  { name: '10-solutie-unica', run: () => ({ passed: true }) },
  {
    name: '11-dificultate',
    run({ pkg }) {
      const problems: string[] = [];
      for (const g of pkg.games)
        if (!DIFFICULTIES.includes(g.difficulty)) problems.push(`${g.id}: ${g.difficulty}`);
      const types = new Set(pkg.games.map((g) => g.type));
      for (const required of CORE_HOME_GAME_TYPES) {
        const satisfied =
          types.has(required) ||
          (required === 'rebus' && (types.has('careu') || pkg.fallbacks.swappedGames.includes('rebus')));
        if (!satisfied) problems.push(`lipsește jocul obligatoriu: ${required}`);
      }
      if (pkg.games.length < 6) problems.push(`doar ${pkg.games.length} jocuri (minim 6)`);
      return problems.length ? { passed: false, detail: problems.slice(0, 3).join('; ') } : { passed: true };
    },
  },
  {
    name: '12-hash-continut',
    run({ pkg }) {
      const expected = hashObject({ date: pkg.date, seed: pkg.seed, games: pkg.games });
      return expected === pkg.contentHash
        ? { passed: true }
        : { passed: false, detail: 'contentHash nu corespunde conținutului' };
    },
  },
  {
    name: '13-arhiva-dedup',
    run({ pkg, dedupIndex }) {
      if (!dedupIndex) return { passed: true, detail: 'fără index (sărit)' };
      const problems: string[] = [];
      for (const g of pkg.games) {
        const fp = fingerprintGame(g);
        for (const grid of fp.grids)
          if (isConflict(dedupIndex, 'grid', grid, pkg.date)) problems.push(`grilă repetată (${g.type})`);
        for (const s of fp.seeds)
          if (isConflict(dedupIndex, 'seed', s, pkg.date)) problems.push(`seed repetat (${g.type})`);
        for (const a of fp.answers)
          if (isConflict(dedupIndex, 'answer', a, pkg.date)) problems.push(`răspuns repetat (${g.type}: ${a})`);
        for (const d of fp.definitions)
          if (isConflict(dedupIndex, 'definition', d, pkg.date)) problems.push(`definiție repetată (${g.type})`);
        for (const w of fp.wordsets)
          if (isConflict(dedupIndex, 'wordset', w, pkg.date)) problems.push(`set de cuvinte repetat (${g.type})`);
      }
      if (isConflict(dedupIndex, 'theme', pkg.theme, pkg.date))
        problems.push(`temă repetată: ${pkg.theme}`);
      return problems.length ? { passed: false, detail: problems.slice(0, 4).join('; ') } : { passed: true };
    },
  },
  {
    name: '14-test-randare',
    run({ pkg }) {
      try {
        const text = renderPackageText(pkg);
        return text.length > 100 ? { passed: true } : { passed: false, detail: 'randare suspect de scurtă' };
      } catch (e) {
        return { passed: false, detail: e instanceof Error ? e.message : 'randare eșuată' };
      }
    },
  },
];

/**
 * Run the full validation pipeline (stages 1–14; stage 15, atomic publish, is
 * performed by the caller only when everything here passed).
 *
 * Stages 8/9/10 (intersections, independent solver, uniqueness) are backed by
 * the per-game independent validators, which are separate modules from the
 * generators — a generator is never the only validator of its own output.
 */
export function validatePackage(
  pkg: DailyPackage,
  options: { dedupIndex?: DedupIndex | null } = {},
): PackageValidationOutcome {
  const checks: ValidationCheck[] = [];
  const gameResults = new Map<string, ValidatorResult>();
  const ctx: StageContext = { pkg, dedupIndex: options.dedupIndex ?? null, gameResults };

  // Pre-compute per-game validator results once (used by stages 8–10).
  let structurallyParseable = true;
  const parsed = dailyPackageSchema.safeParse(pkg);
  if (!parsed.success) structurallyParseable = false;
  if (structurallyParseable) {
    for (const g of pkg.games) gameResults.set(g.id, validateGame(g));
  }

  const crosswordFamily = new Set(['rebus', 'careu', 'integrame']);
  const solverFamily = new Set(['sudoku', 'nonograma', 'kakuro', 'labirint']);
  const uniqueFamily = new Set(['sudoku', 'nonograma', 'kakuro']);

  const dynamicStages: Record<string, () => { passed: boolean; detail?: string }> = {
    '08-intersectii': () => {
      const failures: string[] = [];
      for (const g of pkg.games) {
        if (!crosswordFamily.has(g.type)) continue;
        const res = gameResults.get(g.id);
        if (res && !res.ok) failures.push(`${g.id}: ${res.errors[0]}`);
      }
      return failures.length ? { passed: false, detail: failures.slice(0, 2).join('; ') } : { passed: true };
    },
    '09-solver-independent': () => {
      const failures: string[] = [];
      for (const g of pkg.games) {
        const res = gameResults.get(g.id);
        if (!res) continue;
        if (!res.ok) failures.push(`${g.id}: ${res.errors[0]}`);
        else if (solverFamily.has(g.type) && res.errors.length > 0) failures.push(`${g.id}: ${res.errors[0]}`);
      }
      return failures.length ? { passed: false, detail: failures.slice(0, 3).join('; ') } : { passed: true };
    },
    '10-solutie-unica': () => {
      const failures: string[] = [];
      for (const g of pkg.games) {
        if (!uniqueFamily.has(g.type)) continue;
        const meta = g.validationMetadata as { uniqueSolution?: boolean };
        if (meta.uniqueSolution !== true) failures.push(`${g.id}: metadate fără soluție unică`);
        const res = gameResults.get(g.id);
        if (res && !res.ok && res.errors.some((e) => e.toLowerCase().includes('unic')))
          failures.push(`${g.id}: ${res.errors.find((e) => e.toLowerCase().includes('unic'))}`);
      }
      return failures.length ? { passed: false, detail: failures.slice(0, 3).join('; ') } : { passed: true };
    },
  };

  let allPassed = true;
  for (const stage of STAGES) {
    let outcome: { passed: boolean; detail?: string };
    try {
      const dynamic = dynamicStages[stage.name];
      outcome = dynamic ? dynamic() : stage.run(ctx);
    } catch (e) {
      outcome = { passed: false, detail: e instanceof Error ? e.message : 'excepție în validare' };
    }
    checks.push({ stage: stage.name, passed: outcome.passed, ...(outcome.detail ? { detail: outcome.detail } : {}) });
    if (!outcome.passed) allPassed = false;
  }

  return { passed: allPassed, checks, gameResults };
}
