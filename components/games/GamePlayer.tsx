'use client';

import type { Game } from '@/lib/schema/games';
import { SudokuBoard } from './SudokuBoard';
import { NonogramBoard } from './NonogramBoard';
import { KakuroBoard } from './KakuroBoard';
import { MazeBoard } from './MazeBoard';
import { WordSearchBoard } from './WordSearchBoard';
import { CrosswordBoard } from './CrosswordBoard';
import { AnagramBoard } from './AnagramBoard';
import { QuickChallengeBoard } from './QuickChallengeBoard';
import { LogicSequenceBoard } from './LogicSequenceBoard';
import { MysteryWordBoard } from './MysteryWordBoard';

/** Render the correct interactive board for any game. */
export function GamePlayer({ game }: { game: Game }) {
  switch (game.type) {
    case 'sudoku':
      return <SudokuBoard game={game} />;
    case 'nonograma':
      return <NonogramBoard game={game} />;
    case 'kakuro':
      return <KakuroBoard game={game} />;
    case 'labirint':
      return <MazeBoard game={game} />;
    case 'cuvinte-ascunse':
      return <WordSearchBoard game={game} />;
    case 'rebus':
    case 'careu':
    case 'integrame':
      return <CrosswordBoard game={game} />;
    case 'anagrame':
      return <AnagramBoard game={game} />;
    case 'provocare-rapida':
      return <QuickChallengeBoard game={game} />;
    case 'secvente-logice':
      return <LogicSequenceBoard game={game} />;
    case 'cuvant-misterios':
      return <MysteryWordBoard game={game} />;
  }
}
