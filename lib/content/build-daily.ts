import { createRng, makeSeed } from '@/lib/rng';
import { hashObject } from '@/lib/hash';
import { createLogger } from '@/lib/log';
import type { DailyPackage, FallbackInfo } from '@/lib/schema/pack';
import type { Difficulty, GameType } from '@/lib/schema/common';
import { CONTENT_LOCALE, SCHEMA_VERSION, GAME_META } from '@/lib/schema/common';
import type { Game } from '@/lib/schema/games';
import { difficultyFor, rotatingGameFor, estimatedMinutesFor } from './plan';
import type { EditorialPayload } from '@/lib/ai/schema';
import { LOCAL_THEMES, localThemeWords } from '@/lib/dictionary/local-themes';
import { DEFINITIONS } from '@/lib/dictionary/definitions.data';
import { pool } from '@/lib/dictionary';
import { normalizeForGrid } from '@/lib/text/diacritics';

import { generateSudoku } from '@/generators/sudoku';
import { generateNonogram } from '@/generators/nonogram';
import { generateKakuro } from '@/generators/kakuro';
import { generateMaze } from '@/generators/maze';
import { generateWordSearch } from '@/generators/word-search';
import { generateCrossword, type ClueWord } from '@/generators/crossword';
import { generateAnagrams } from '@/generators/anagram';
import { generateQuickChallenge } from '@/generators/quick-challenge';
import { generateLogicSequence } from '@/generators/logic-sequence';
import { generateMysteryWord } from '@/generators/mystery-word';

const log = createLogger({ component: 'build-daily' });

export interface EditorialSource {
  payload: EditorialPayload;
  model: string;
  aiSource: 'primary' | 'fallback-model' | 'local-theme' | 'none';
}

/** Build a local (no-AI) editorial payload from the internal theme collection. */
export function localEditorial(_date: string, seed: string): EditorialSource {
  const rng = createRng(makeSeed(seed, 'local-theme'));
  const theme = rng.pick(LOCAL_THEMES);
  const themeWords = localThemeWords(theme.slug);

  const withClue = themeWords.filter((w) => DEFINITIONS[w.normalized]);
  const globalWithClue = pool({ minLength: 3, maxLength: 10 }).filter((w) => DEFINITIONS[w.normalized]);
  const crosswordSource = [...withClue];
  for (const w of rng.shuffled(globalWithClue)) {
    if (crosswordSource.length >= 20) break;
    if (!crosswordSource.some((x) => x.normalized === w.normalized)) crosswordSource.push(w);
  }

  let wsWords = themeWords.filter((w) => w.length >= 4 && w.length <= 12).map((w) => w.display);
  for (const w of rng.shuffled(pool({ minLength: 4, maxLength: 12, minFreq: 3 }))) {
    if (wsWords.length >= 14) break;
    if (!wsWords.includes(w.display)) wsWords.push(w.display);
  }

  return {
    payload: {
      theme: { slug: theme.slug, title: theme.title, description: theme.description },
      dailyTitle: `${theme.title} — provocările zilei`,
      dailyDescription: `${theme.description} Jocuri noi, generate automat pentru astăzi.`,
      crosswordWords: crosswordSource.slice(0, 20).map((w) => ({
        word: w.display,
        clue: DEFINITIONS[w.normalized]!,
        pos: (['subst', 'adj', 'verb', 'adv'].includes(w.pos) ? w.pos : 'subst') as
          | 'subst'
          | 'adj'
          | 'verb'
          | 'adv',
      })),
      wordSearchWords: wsWords.slice(0, 16),
      anagramHints: [],
      quickChallengeCandidates: [],
    },
    model: 'local',
    aiSource: 'local-theme',
  };
}

interface BuildOptions {
  date: string;
  seed: string;
  editorial: EditorialSource;
  generatedAt?: string;
}

function baseFields(
  date: string,
  seed: string,
  type: GameType,
  difficulty: Difficulty,
  title: string,
  description: string,
  instructions: string,
  hints: string[],
) {
  return {
    id: `${date}-${type}`,
    type,
    title,
    description,
    difficulty,
    estimatedMinutes: estimatedMinutesFor(type, difficulty),
    seed: makeSeed(seed, type),
    instructions,
    hints: hints.slice(0, 3),
  };
}

function buildSudokuGame(date: string, seed: string): Game {
  const difficulty = difficultyFor(date, 'sudoku');
  const b = generateSudoku(makeSeed(seed, 'sudoku'), difficulty);
  return {
    ...baseFields(
      date,
      seed,
      'sudoku',
      b.difficulty,
      'Sudoku zilnic',
      'Completează grila 9×9 astfel încât fiecare rând, coloană și bloc să conțină cifrele 1–9.',
      'Atinge o celulă și introdu o cifră de la 1 la 9. Fiecare cifră poate apărea o singură dată pe rând, pe coloană și în fiecare bloc de 3×3.',
      [
        'Caută rândurile, coloanele sau blocurile cu cele mai multe cifre completate.',
        'Notează candidații posibili în celulele goale.',
        'Dacă o cifră poate sta într-un singur loc dintr-un bloc, acela este locul ei.',
      ],
    ),
    type: 'sudoku',
    puzzle: { size: 9, boxSize: 3, givens: b.givens },
    solution: { grid: b.solution },
    validationMetadata: {
      givenCount: b.givenCount,
      emptyCount: b.emptyCount,
      uniqueSolution: true,
      techniques: b.techniques,
      solverDifficultyScore: b.score,
    },
  };
}

function buildNonogramGame(date: string, seed: string): Game {
  const difficulty = difficultyFor(date, 'nonograma');
  const b = generateNonogram(makeSeed(seed, 'nonograma'), difficulty);
  return {
    ...baseFields(
      date,
      seed,
      'nonograma',
      difficulty,
      'Nonograma zilei',
      'Colorează celulele corecte după indicii numerice și descoperă imaginea ascunsă.',
      'Numerele arată lungimile grupurilor de celule pline de pe fiecare rând și coloană, în ordine. Între grupuri există cel puțin o celulă goală. Folosește click stânga pentru plin și click dreapta (sau modul X) pentru gol.',
      [
        'Începe cu rândurile și coloanele cu indicii mari.',
        'Marchează cu X celulele care sigur rămân goale.',
        'Compară indicii de pe rând cu cei de pe coloană pentru fiecare celulă nesigură.',
      ],
    ),
    type: 'nonograma',
    puzzle: { width: b.width, height: b.height, rowClues: b.rowClues, colClues: b.colClues },
    solution: { grid: b.solution },
    validationMetadata: {
      filledRatio: Number(b.filledRatio.toFixed(3)),
      uniqueSolution: true,
      lineSolvable: true,
    },
  };
}

function buildKakuroGame(date: string, seed: string): Game {
  const difficulty = difficultyFor(date, 'kakuro');
  const b = generateKakuro(makeSeed(seed, 'kakuro'), difficulty);
  return {
    ...baseFields(
      date,
      seed,
      'kakuro',
      difficulty,
      'Kakuro',
      'Completează grila cu cifre 1–9 astfel încât sumele de pe rânduri și coloane să corespundă.',
      'Fiecare serie albă trebuie să însumeze exact numărul indicat în celula gri din stânga (pentru orizontal) sau de deasupra (pentru vertical). Într-o serie, cifrele nu se repetă.',
      [
        'Seriile scurte cu sume mici sau mari au puține combinații posibile.',
        'O sumă de 3 pe două celule înseamnă 1 și 2.',
        'Notează combinațiile posibile în colțul celulei.',
      ],
    ),
    type: 'kakuro',
    puzzle: { width: b.width, height: b.height, cells: b.cells },
    solution: { grid: b.solution },
    validationMetadata: { entryCount: b.entryCount, uniqueSolution: true },
  };
}

function buildMazeGame(date: string, seed: string): Game {
  const difficulty = difficultyFor(date, 'labirint');
  const b = generateMaze(makeSeed(seed, 'labirint'), difficulty);
  return {
    ...baseFields(
      date,
      seed,
      'labirint',
      difficulty,
      'Labirintul zilei',
      'Găsește drumul de la intrare la ieșire.',
      'Pornește din colțul din stânga-sus și ajungi în colțul din dreapta-jos. Folosește săgețile, mouse-ul sau degetul pentru a avansa prin coridoare.',
      [
        'Urmează mereu peretele din dreapta — te va scoate la ieșire.',
        'Marchează mental intersecțiile deja vizitate.',
        'Dacă te blochezi, întoarce-te la ultima intersecție.',
      ],
    ),
    type: 'labirint',
    puzzle: {
      width: b.width,
      height: b.height,
      walls: b.walls,
      start: b.start,
      end: b.end,
      algorithm: b.algorithm,
    },
    solution: { path: b.path },
    validationMetadata: { pathLength: b.path.length, hasSolution: true },
  };
}

function buildWordSearchGame(
  date: string,
  seed: string,
  editorial: EditorialPayload,
  variant: 'main' | 'backup' = 'main',
): Game {
  const type: GameType = 'cuvinte-ascunse';
  const difficulty = difficultyFor(date, type);
  const words =
    editorial.wordSearchWords.length >= 8
      ? editorial.wordSearchWords
      : pool({ minLength: 4, maxLength: 12, minFreq: 3 }).map((w) => w.display);
  const b = generateWordSearch(makeSeed(seed, type, variant), difficulty, words);
  return {
    ...baseFields(
      date,
      seed,
      type,
      difficulty,
      variant === 'main' ? 'Cuvinte ascunse' : 'Cuvinte ascunse (bonus)',
      `Găsește cuvintele pe tema „${editorial.theme.title}” ascunse în grilă.`,
      'Cuvintele sunt ascunse pe orizontală, verticală sau diagonală. Trage cu mouse-ul sau cu degetul peste litere pentru a selecta un cuvânt.',
      [
        'Caută mai întâi literele rare: Ș, Ț, X, Z.',
        'Cuvintele lungi sunt mai ușor de reperat.',
        'Bifează cuvintele găsite din listă.',
      ],
    ),
    type,
    puzzle: { width: b.width, height: b.height, grid: b.grid, words: b.words },
    solution: { placements: b.placements },
    validationMetadata: {
      wordCount: b.words.length,
      allowsReversed: b.allowsReversed,
      allowsDiagonal: b.allowsDiagonal,
    },
  } as Game;
}

function buildCrosswordGame(
  date: string,
  seed: string,
  editorial: EditorialPayload,
  type: 'rebus' | 'careu' | 'integrame',
  exclude: Set<string> = new Set(),
): Game | null {
  const difficulty = difficultyFor(date, type);
  const clueWords: ClueWord[] = editorial.crosswordWords
    .map((w) => ({ display: w.word, normalized: normalizeForGrid(w.word), clue: w.clue }))
    .filter((w) => !exclude.has(w.normalized));

  // Top up with locally-defined words so the assembler always has material.
  const local = pool({ minLength: 3, maxLength: 10 })
    .filter((w) => DEFINITIONS[w.normalized] && !exclude.has(w.normalized))
    .map((w) => ({ display: w.display, normalized: w.normalized, clue: DEFINITIONS[w.normalized]! }));
  for (const lw of local) {
    if (clueWords.length >= 26) break;
    if (!clueWords.some((x) => x.normalized === lw.normalized)) clueWords.push(lw);
  }

  // Spec: up to five attempts before falling back to a backup game.
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const b = generateCrossword(makeSeed(seed, type, `try-${attempt}`), difficulty, clueWords);
      const meta = GAME_META[type];
      return {
        ...baseFields(
          date,
          seed,
          type,
          difficulty,
          type === 'rebus' ? 'Rebusul zilei' : meta.label,
          `Careu de cuvinte încrucișate pe tema „${editorial.theme.title}”.`,
          'Completează cuvintele pe orizontală și verticală folosind definițiile numerotate. Scrie fără diacritice — ele se potrivesc automat.',
          [
            'Începe cu definițiile ale căror răspunsuri le știi sigur.',
            'Literele din intersecții îți confirmă răspunsurile.',
            'Lungimea răspunsului este afișată lângă definiție.',
          ],
        ),
        type,
        puzzle: {
          width: b.width,
          height: b.height,
          blocks: b.blocks,
          numbers: b.numbers,
          entries: b.entries.map((e) => ({ ...e })),
        },
        solution: { grid: b.grid },
        validationMetadata: {
          wordCount: b.wordCount,
          intersectionRatio: Number(b.intersectionRatio.toFixed(3)),
          theme: editorial.theme.slug,
        },
      } as Game;
    } catch (err) {
      log.warn('crossword attempt failed', {
        date,
        type,
        attempt,
        reason: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return null;
}

function buildAnagramGame(date: string, seed: string, editorial: EditorialPayload): Game {
  const difficulty = difficultyFor(date, 'anagrame');
  const hints = new Map<string, string>();
  for (const h of editorial.anagramHints) {
    const norm = normalizeForGrid(h.word);
    if (norm && !normalizeForGrid(h.hint).includes(norm)) hints.set(norm, h.hint);
  }
  const b = generateAnagrams(makeSeed(seed, 'anagrame'), difficulty, editorial.theme.slug, hints);
  return {
    ...baseFields(
      date,
      seed,
      'anagrame',
      difficulty,
      'Anagrame',
      'Rearanjează literele și descoperă cuvintele ascunse.',
      'Fiecare rând conține literele amestecate ale unui cuvânt românesc. Scrie cuvântul corect — diacriticele nu sunt necesare.',
      b.items
        .filter((it) => it.hint)
        .slice(0, 3)
        .map((it) => `Indiciu pentru ${it.scrambled}: ${it.hint!}`),
    ),
    type: 'anagrame',
    puzzle: {
      items: b.items.map((it) => ({
        scrambled: it.scrambled,
        length: it.normalized.length,
        ...(it.hint ? { hint: it.hint } : {}),
      })),
      theme: editorial.theme.title,
    },
    solution: { answers: b.items.map((it) => it.answer) },
    validationMetadata: { averageLength: Number(b.averageLength.toFixed(2)) },
  };
}

function buildQuickChallengeGame(date: string, seed: string): Game {
  const difficulty = difficultyFor(date, 'provocare-rapida');
  const b = generateQuickChallenge(makeSeed(seed, 'provocare-rapida'), difficulty);
  return {
    ...baseFields(
      date,
      seed,
      'provocare-rapida',
      difficulty,
      'Provocarea rapidă',
      `Ghicește cuvântul zilei din ${b.length} litere în cel mult 6 încercări.`,
      'Scrie un cuvânt românesc valid și apasă Enter. Verde = literă corectă pe poziția corectă; galben = litera există pe altă poziție; gri = litera nu apare.',
      [
        'Începe cu un cuvânt bogat în vocale.',
        'Folosește literele galbene pe alte poziții.',
        'Elimină literele gri din următoarele încercări.',
      ],
    ),
    type: 'provocare-rapida',
    puzzle: { length: b.length, maxAttempts: 6 },
    solution: { answer: b.answer },
    validationMetadata: { frequencyRank: b.frequencyRank },
  };
}

function buildLogicSequenceGame(date: string, seed: string): Game {
  const difficulty = difficultyFor(date, 'secvente-logice');
  const b = generateLogicSequence(makeSeed(seed, 'secvente-logice'), difficulty);
  return {
    ...baseFields(
      date,
      seed,
      'secvente-logice',
      difficulty,
      'Secvențe logice',
      'Descoperă regula și continuă șirul de numere.',
      'Analizează șirul de numere și alege valoarea care înlocuiește semnul de întrebare.',
      [
        'Calculează diferența dintre termeni consecutivi.',
        'Verifică dacă termenii se înmulțesc cu același număr.',
        'Uneori regula combină doi pași alternativi.',
      ],
    ),
    type: 'secvente-logice',
    puzzle: { sequence: b.sequence, prompt: 'Ce număr urmează în șir?', options: b.options },
    solution: { answer: b.answer, rule: b.rule },
    validationMetadata: { ruleFamily: b.ruleFamily },
  };
}

function buildMysteryWordGame(date: string, seed: string): Game {
  const difficulty = difficultyFor(date, 'cuvant-misterios');
  const b = generateMysteryWord(makeSeed(seed, 'cuvant-misterios'), difficulty);
  return {
    ...baseFields(
      date,
      seed,
      'cuvant-misterios',
      difficulty,
      'Cuvântul misterios',
      `Descoperă cuvântul ascuns din categoria „${b.category}”.`,
      'Câteva litere sunt dezvăluite. Completează literele lipsă și descoperă cuvântul întreg. Diacriticele nu sunt necesare.',
      [
        `Cuvântul face parte din categoria „${b.category}”.`,
        `Prima literă este „${b.normalized[0]}”.`,
        `Cuvântul are ${b.normalized.length} litere.`,
      ],
    ),
    type: 'cuvant-misterios',
    puzzle: { length: b.normalized.length, category: b.category, revealed: b.revealed },
    solution: { answer: b.answer },
    validationMetadata: { revealedCount: b.revealed.length },
  };
}

/**
 * Assemble the complete daily package. Games are built deterministically from
 * the seed; the editorial payload contributes themes/words/clues only. Any
 * per-game failure falls back to a safe algorithmic alternative and is noted.
 */
export function buildDailyPackage(options: BuildOptions): DailyPackage {
  const { date, seed, editorial } = options;
  const swappedGames: string[] = [];
  const notes: string[] = [];

  const games: Game[] = [];

  // 1. Sudoku — always.
  games.push(buildSudokuGame(date, seed));

  // 2. Rebus (crossword) — with word-search backup per spec.
  const rotating = rotatingGameFor(date);
  const rebus = buildCrosswordGame(date, seed, editorial.payload, 'rebus');
  const usedCrosswordAnswers = new Set<string>();
  if (rebus) {
    games.push(rebus);
    if (rebus.type === 'rebus') for (const e of rebus.puzzle.entries) usedCrosswordAnswers.add(normalizeForGrid(e.answer));
  } else {
    swappedGames.push('rebus');
    notes.push('Rebusul nu a putut fi construit; a fost înlocuit cu un joc de cuvinte ascunse bonus.');
    games.push(buildWordSearchGame(date, seed, editorial.payload, 'backup'));
  }

  // 3. Word search — always.
  games.push(buildWordSearchGame(date, seed, editorial.payload, 'main'));

  // 4. Nonogram — always.
  games.push(buildNonogramGame(date, seed));

  // 5. Quick challenge — always.
  games.push(buildQuickChallengeGame(date, seed));

  // 6. Rotating extra game — resilient: any generator failure swaps to a
  // reliable algorithmic game (maze) so the day is never short a game.
  const buildRotating = (): Game => {
    switch (rotating) {
      case 'kakuro':
        return buildKakuroGame(date, seed);
      case 'anagrame':
        return buildAnagramGame(date, seed, editorial.payload);
      case 'labirint':
        return buildMazeGame(date, seed);
      case 'integrame': {
        const integrame = buildCrosswordGame(date, seed, editorial.payload, 'integrame', usedCrosswordAnswers);
        if (!integrame) throw new Error('integrame assembly failed');
        return integrame;
      }
      case 'secvente-logice':
        return buildLogicSequenceGame(date, seed);
      case 'cuvant-misterios':
        return buildMysteryWordGame(date, seed);
      default:
        return buildKakuroGame(date, seed);
    }
  };
  try {
    games.push(buildRotating());
  } catch (err) {
    swappedGames.push(rotating);
    notes.push(
      `Jocul „${GAME_META[rotating].label}” nu a putut fi generat (${
        err instanceof Error ? err.message : 'eroare'
      }); a fost înlocuit cu un labirint.`,
    );
    games.push(buildMazeGame(date, makeSeed(seed, 'labirint-fallback')));
  }

  // Local-theme fallback must guarantee the full backup roster:
  // Sudoku, Nonogramă, Kakuro, labirint, anagramă, cuvinte ascunse.
  if (editorial.aiSource === 'local-theme') {
    const have = new Set(games.map((g) => g.type));
    if (!have.has('kakuro')) games.push(buildKakuroGame(date, seed));
    if (!have.has('labirint')) games.push(buildMazeGame(date, seed));
    if (!have.has('anagrame')) games.push(buildAnagramGame(date, seed, editorial.payload));
    notes.push('Pachet construit fără AI, cu temă locală și jocuri algoritmice.');
  }

  const fallbacks: FallbackInfo = {
    used: editorial.aiSource === 'local-theme' || swappedGames.length > 0,
    aiSource: editorial.aiSource,
    swappedGames,
    notes,
  };

  const generatedAt = options.generatedAt ?? new Date().toISOString();

  const withoutHash: Omit<DailyPackage, 'contentHash' | 'validation'> = {
    date,
    locale: CONTENT_LOCALE,
    schemaVersion: SCHEMA_VERSION,
    generatedAt,
    generationModel: editorial.model,
    seed,
    theme: editorial.payload.theme.slug,
    title: editorial.payload.dailyTitle,
    description: editorial.payload.dailyDescription,
    games,
    fallbacks,
  };

  // Hash covers the durable content (not validation metadata / timestamps).
  const contentHash = hashObject({ date, seed, games });

  return {
    ...withoutHash,
    contentHash,
    validation: {
      passed: false,
      checks: [],
      validatedAt: generatedAt,
      validatorVersion: 1,
    },
  };
}
