import type { Game } from '@/lib/schema/games';
import type { ValidatorResult } from './types';
import { validateSudoku } from './sudoku';
import { validateNonogram } from './nonogram';
import { validateKakuro } from './kakuro';
import { validateMaze } from './maze';
import { validateWordSearch } from './word-search';
import { validateCrossword } from './crossword';
import { validateAnagram } from './anagram';
import { validateQuickChallenge } from './quick-challenge';
import { validateLogicSequence } from './logic-sequence';
import { validateMysteryWord } from './mystery-word';

/** Dispatch a game to its independent, type-specific validator. */
export function validateGame(game: Game): ValidatorResult {
  switch (game.type) {
    case 'sudoku':
      return validateSudoku(game);
    case 'nonograma':
      return validateNonogram(game);
    case 'kakuro':
      return validateKakuro(game);
    case 'labirint':
      return validateMaze(game);
    case 'cuvinte-ascunse':
      return validateWordSearch(game);
    case 'rebus':
    case 'careu':
    case 'integrame':
      return validateCrossword(game);
    case 'anagrame':
      return validateAnagram(game);
    case 'provocare-rapida':
      return validateQuickChallenge(game);
    case 'secvente-logice':
      return validateLogicSequence(game);
    case 'cuvant-misterios':
      return validateMysteryWord(game);
  }
}
