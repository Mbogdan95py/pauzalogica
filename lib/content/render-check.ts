import type { DailyPackage } from '@/lib/schema/pack';
import type { Game } from '@/lib/schema/games';

/**
 * Render test: produce a plain-text preview of every game, exercising the same
 * data paths the UI uses (grids, clues, lists). Any structural surprise throws,
 * which fails the "test de randare" validation stage before publish.
 */
export function renderGameText(game: Game): string {
  const lines: string[] = [`# ${game.title} [${game.type}] (${game.difficulty})`];
  switch (game.type) {
    case 'sudoku': {
      for (const row of game.puzzle.givens) lines.push(row.map((v) => (v === 0 ? '.' : String(v))).join(''));
      break;
    }
    case 'nonograma': {
      lines.push(`rows: ${game.puzzle.rowClues.map((r) => r.join(',') || '0').join(' | ')}`);
      lines.push(`cols: ${game.puzzle.colClues.map((c) => c.join(',') || '0').join(' | ')}`);
      break;
    }
    case 'kakuro': {
      for (const row of game.puzzle.cells) {
        lines.push(
          row
            .map((cell) =>
              cell.kind === 'block' ? `[${cell.down ?? ''}\\${cell.right ?? ''}]` : '( )',
            )
            .join(''),
        );
      }
      break;
    }
    case 'labirint': {
      lines.push(`maze ${game.puzzle.width}x${game.puzzle.height} via ${game.puzzle.algorithm}`);
      lines.push(`start ${game.puzzle.start.row},${game.puzzle.start.col} → end ${game.puzzle.end.row},${game.puzzle.end.col}`);
      const first = game.puzzle.walls[0]![0]!;
      if (typeof first !== 'number') throw new Error('maze walls malformed');
      break;
    }
    case 'cuvinte-ascunse': {
      for (const row of game.puzzle.grid) lines.push(row.join(''));
      lines.push(`words: ${game.puzzle.words.map((w) => w.display).join(', ')}`);
      break;
    }
    case 'rebus':
    case 'careu':
    case 'integrame': {
      for (let r = 0; r < game.puzzle.height; r++) {
        lines.push(
          game.puzzle.blocks[r]!
            .map((b, c) => (b ? '#' : game.puzzle.numbers[r]![c] ? String(game.puzzle.numbers[r]![c] % 10) : '_'))
            .join(''),
        );
      }
      for (const e of game.puzzle.entries) {
        lines.push(`${e.number}${e.direction === 'across' ? 'O' : 'V'} (${e.length}): ${e.clue}`);
      }
      break;
    }
    case 'anagrame': {
      for (const item of game.puzzle.items) lines.push(`${item.scrambled} (${item.length})`);
      break;
    }
    case 'provocare-rapida': {
      lines.push(`word of ${game.puzzle.length} letters, ${game.puzzle.maxAttempts} attempts`);
      break;
    }
    case 'secvente-logice': {
      lines.push(game.puzzle.sequence.map((v) => (v === null ? '?' : String(v))).join(', '));
      lines.push(`options: ${game.puzzle.options.join(', ')}`);
      break;
    }
    case 'cuvant-misterios': {
      const mask = Array.from({ length: game.puzzle.length }, (_, i) =>
        game.puzzle.revealed.includes(i) ? 'X' : '_',
      ).join('');
      lines.push(`${mask} (${game.puzzle.category})`);
      break;
    }
  }
  if (game.instructions.length === 0) throw new Error('missing instructions');
  return lines.join('\n');
}

export function renderPackageText(pkg: DailyPackage): string {
  const parts = [`== ${pkg.date} — ${pkg.title} ==`, pkg.description];
  for (const game of pkg.games) parts.push(renderGameText(game));
  return parts.join('\n\n');
}
