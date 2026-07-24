import { z } from 'zod';
import { difficultySchema } from './common';

/**
 * Puzzle/solution schemas for every game type, combined into a discriminated
 * union keyed on `type`. Puzzle and solution are always stored together in the
 * daily JSON; the UI simply avoids *displaying* the solution until the player
 * finishes or explicitly reveals it.
 */

// --- shared fragments -------------------------------------------------------

const cellCoord = z.object({ row: z.number().int().min(0), col: z.number().int().min(0) });

const gridNumber = z.array(z.array(z.number().int())).min(1);

// --- Sudoku -----------------------------------------------------------------

export const sudokuPuzzleSchema = z.object({
  size: z.literal(9),
  boxSize: z.literal(3),
  /** 0 = empty cell, 1..9 = given. */
  givens: gridNumber,
});
export const sudokuSolutionSchema = z.object({
  grid: gridNumber,
});
export const sudokuMetaSchema = z.object({
  givenCount: z.number().int(),
  emptyCount: z.number().int(),
  uniqueSolution: z.literal(true),
  techniques: z.array(z.string()),
  solverDifficultyScore: z.number(),
});

// --- Nonogramă --------------------------------------------------------------

export const nonogramPuzzleSchema = z.object({
  width: z.number().int().min(5).max(25),
  height: z.number().int().min(5).max(25),
  rowClues: z.array(z.array(z.number().int().min(1))),
  colClues: z.array(z.array(z.number().int().min(1))),
});
export const nonogramSolutionSchema = z.object({
  /** 1 = filled, 0 = empty. */
  grid: z.array(z.array(z.number().int().min(0).max(1))),
});
export const nonogramMetaSchema = z.object({
  filledRatio: z.number(),
  uniqueSolution: z.literal(true),
  lineSolvable: z.boolean(),
});

// --- Kakuro -----------------------------------------------------------------

export const kakuroCellSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('block'),
    /** sum for the run of entry cells to the right (across), if any */
    right: z.number().int().min(1).max(45).nullable(),
    /** sum for the run of entry cells below (down), if any */
    down: z.number().int().min(1).max(45).nullable(),
  }),
  z.object({ kind: z.literal('entry') }),
]);
export const kakuroPuzzleSchema = z.object({
  width: z.number().int().min(3).max(16),
  height: z.number().int().min(3).max(16),
  cells: z.array(z.array(kakuroCellSchema)),
});
export const kakuroSolutionSchema = z.object({
  /** 0 for block cells, 1..9 for entry cells. */
  grid: gridNumber,
});
export const kakuroMetaSchema = z.object({
  entryCount: z.number().int(),
  uniqueSolution: z.literal(true),
});

// --- Labirint ---------------------------------------------------------------

export const mazePuzzleSchema = z.object({
  width: z.number().int().min(5).max(41),
  height: z.number().int().min(5).max(41),
  /**
   * Per-cell wall bitmask: 1=North, 2=East, 4=South, 8=West. A set bit means a
   * wall on that side of the cell.
   */
  walls: z.array(z.array(z.number().int().min(0).max(15))),
  start: cellCoord,
  end: cellCoord,
  algorithm: z.string(),
});
export const mazeSolutionSchema = z.object({
  path: z.array(cellCoord).min(2),
});
export const mazeMetaSchema = z.object({
  pathLength: z.number().int(),
  hasSolution: z.literal(true),
});

// --- Cuvinte ascunse (word search) -----------------------------------------

export const wordSearchWordSchema = z.object({
  display: z.string(),
  normalized: z.string(),
});
export const wordSearchPlacementSchema = z.object({
  normalized: z.string(),
  row: z.number().int(),
  col: z.number().int(),
  /** direction as [dRow, dCol] */
  dir: z.tuple([z.number().int(), z.number().int()]),
  cells: z.array(cellCoord),
});
export const wordSearchPuzzleSchema = z.object({
  width: z.number().int().min(6).max(20),
  height: z.number().int().min(6).max(20),
  grid: z.array(z.array(z.string().length(1))),
  words: z.array(wordSearchWordSchema).min(6),
});
export const wordSearchSolutionSchema = z.object({
  placements: z.array(wordSearchPlacementSchema),
});
export const wordSearchMetaSchema = z.object({
  wordCount: z.number().int(),
  allowsReversed: z.boolean(),
  allowsDiagonal: z.boolean(),
});

// --- Crossword family (rebus / careu / integrame) --------------------------

export const crosswordEntrySchema = z.object({
  number: z.number().int().min(1),
  direction: z.enum(['across', 'down']),
  row: z.number().int().min(0),
  col: z.number().int().min(0),
  length: z.number().int().min(2),
  clue: z.string(),
  answer: z.string(),
});
export const crosswordPuzzleSchema = z.object({
  width: z.number().int().min(5).max(21),
  height: z.number().int().min(5).max(21),
  /** true = block/black cell, false = fillable. */
  blocks: z.array(z.array(z.boolean())),
  /** cell numbering; 0 = unnumbered. */
  numbers: z.array(z.array(z.number().int().min(0))),
  entries: z.array(crosswordEntrySchema).min(4),
});
export const crosswordSolutionSchema = z.object({
  /** letters per cell; empty string for block cells. */
  grid: z.array(z.array(z.string())),
});
export const crosswordMetaSchema = z.object({
  wordCount: z.number().int(),
  intersectionRatio: z.number(),
  theme: z.string(),
});

// --- Anagrame ---------------------------------------------------------------

export const anagramItemSchema = z.object({
  scrambled: z.string(),
  length: z.number().int().min(3),
  hint: z.string().optional(),
});
export const anagramPuzzleSchema = z.object({
  items: z.array(anagramItemSchema).min(3),
  theme: z.string(),
});
export const anagramSolutionSchema = z.object({
  answers: z.array(z.string()).min(3),
});
export const anagramMetaSchema = z.object({
  averageLength: z.number(),
});

// --- Provocare rapidă (Wordle-like) ----------------------------------------

export const quickChallengePuzzleSchema = z.object({
  length: z.number().int().min(5).max(8),
  maxAttempts: z.literal(6),
});
export const quickChallengeSolutionSchema = z.object({
  answer: z.string(),
});
export const quickChallengeMetaSchema = z.object({
  frequencyRank: z.number(),
});

// --- Secvențe logice --------------------------------------------------------

export const logicSequencePuzzleSchema = z.object({
  /** the visible sequence; null marks the position to solve. */
  sequence: z.array(z.union([z.number(), z.null()])),
  prompt: z.string(),
  options: z.array(z.number()).min(2),
});
export const logicSequenceSolutionSchema = z.object({
  answer: z.number(),
  rule: z.string(),
});
export const logicSequenceMetaSchema = z.object({
  ruleFamily: z.string(),
});

// --- Cuvânt misterios -------------------------------------------------------

export const mysteryWordPuzzleSchema = z.object({
  length: z.number().int().min(4).max(12),
  category: z.string(),
  /** indices of letters revealed from the start. */
  revealed: z.array(z.number().int().min(0)),
});
export const mysteryWordSolutionSchema = z.object({
  answer: z.string(),
});
export const mysteryWordMetaSchema = z.object({
  revealedCount: z.number().int(),
});

// --- generic game wrapper ---------------------------------------------------

const baseGameFields = {
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  difficulty: difficultySchema,
  estimatedMinutes: z.number().int().min(1).max(120),
  seed: z.string().min(1),
  instructions: z.string().min(1),
  hints: z.array(z.string()),
};

function gameVariant<
  T extends z.ZodTypeAny,
  P extends z.ZodTypeAny,
  S extends z.ZodTypeAny,
  M extends z.ZodTypeAny,
>(type: T, puzzle: P, solution: S, meta: M) {
  return z.object({
    ...baseGameFields,
    type,
    puzzle,
    solution,
    validationMetadata: meta,
  });
}

export const gameSchema = z.discriminatedUnion('type', [
  gameVariant(z.literal('sudoku'), sudokuPuzzleSchema, sudokuSolutionSchema, sudokuMetaSchema),
  gameVariant(z.literal('nonograma'), nonogramPuzzleSchema, nonogramSolutionSchema, nonogramMetaSchema),
  gameVariant(z.literal('kakuro'), kakuroPuzzleSchema, kakuroSolutionSchema, kakuroMetaSchema),
  gameVariant(z.literal('labirint'), mazePuzzleSchema, mazeSolutionSchema, mazeMetaSchema),
  gameVariant(z.literal('cuvinte-ascunse'), wordSearchPuzzleSchema, wordSearchSolutionSchema, wordSearchMetaSchema),
  gameVariant(z.literal('rebus'), crosswordPuzzleSchema, crosswordSolutionSchema, crosswordMetaSchema),
  gameVariant(z.literal('careu'), crosswordPuzzleSchema, crosswordSolutionSchema, crosswordMetaSchema),
  gameVariant(z.literal('integrame'), crosswordPuzzleSchema, crosswordSolutionSchema, crosswordMetaSchema),
  gameVariant(z.literal('anagrame'), anagramPuzzleSchema, anagramSolutionSchema, anagramMetaSchema),
  gameVariant(z.literal('provocare-rapida'), quickChallengePuzzleSchema, quickChallengeSolutionSchema, quickChallengeMetaSchema),
  gameVariant(z.literal('secvente-logice'), logicSequencePuzzleSchema, logicSequenceSolutionSchema, logicSequenceMetaSchema),
  gameVariant(z.literal('cuvant-misterios'), mysteryWordPuzzleSchema, mysteryWordSolutionSchema, mysteryWordMetaSchema),
]);

export type Game = z.infer<typeof gameSchema>;

// Convenience per-type aliases used across generators/UI.
export type SudokuGame = Extract<Game, { type: 'sudoku' }>;
export type NonogramGame = Extract<Game, { type: 'nonograma' }>;
export type KakuroGame = Extract<Game, { type: 'kakuro' }>;
export type MazeGame = Extract<Game, { type: 'labirint' }>;
export type WordSearchGame = Extract<Game, { type: 'cuvinte-ascunse' }>;
export type CrosswordGame = Extract<Game, { type: 'rebus' | 'careu' | 'integrame' }>;
export type AnagramGame = Extract<Game, { type: 'anagrame' }>;
export type QuickChallengeGame = Extract<Game, { type: 'provocare-rapida' }>;
export type LogicSequenceGame = Extract<Game, { type: 'secvente-logice' }>;
export type MysteryWordGame = Extract<Game, { type: 'cuvant-misterios' }>;

export type SudokuPuzzle = z.infer<typeof sudokuPuzzleSchema>;
export type NonogramPuzzle = z.infer<typeof nonogramPuzzleSchema>;
export type KakuroPuzzle = z.infer<typeof kakuroPuzzleSchema>;
export type KakuroCell = z.infer<typeof kakuroCellSchema>;
export type MazePuzzle = z.infer<typeof mazePuzzleSchema>;
export type WordSearchPuzzle = z.infer<typeof wordSearchPuzzleSchema>;
export type WordSearchPlacement = z.infer<typeof wordSearchPlacementSchema>;
export type CrosswordPuzzle = z.infer<typeof crosswordPuzzleSchema>;
export type CrosswordEntry = z.infer<typeof crosswordEntrySchema>;
export type AnagramPuzzle = z.infer<typeof anagramPuzzleSchema>;
export type QuickChallengePuzzle = z.infer<typeof quickChallengePuzzleSchema>;
export type LogicSequencePuzzle = z.infer<typeof logicSequencePuzzleSchema>;
export type MysteryWordPuzzle = z.infer<typeof mysteryWordPuzzleSchema>;
