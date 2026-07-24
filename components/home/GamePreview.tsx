import type { GameType } from '@/lib/schema/common';

/**
 * Small stylized SVG thumbnail per game, echoing the mockup's card previews.
 * Purely decorative (aria-hidden); the accent color comes from the parent card.
 */
export function GamePreview({ type }: { type: GameType }) {
  const common = 'h-full w-full';
  switch (type) {
    case 'sudoku': {
      // Single digits, centered in a clean 3×3 grid (cell centers at 22.7/60/97.3).
      const digits: Array<[string, number, number]> = [
        ['5', 22.7, 22.7],
        ['3', 60, 22.7],
        ['7', 60, 60],
        ['1', 97.3, 60],
        ['9', 22.7, 97.3],
        ['4', 97.3, 97.3],
      ];
      return (
        <svg viewBox="0 0 120 120" className={common} aria-hidden="true">
          <rect x="4" y="4" width="112" height="112" rx="8" className="fill-surface stroke-border" />
          {[1, 2].map((i) => (
            <g key={i} stroke="rgb(var(--c-border))">
              <line x1={4 + i * 37.3} y1="4" x2={4 + i * 37.3} y2="116" strokeWidth="1.5" />
              <line x1="4" y1={4 + i * 37.3} x2="116" y2={4 + i * 37.3} strokeWidth="1.5" />
            </g>
          ))}
          {digits.map(([n, x, y], i) => (
            <text
              key={i}
              x={x}
              y={y}
              className="fill-sudoku"
              fontSize="26"
              fontWeight="700"
              textAnchor="middle"
              dominantBaseline="central"
            >
              {n}
            </text>
          ))}
        </svg>
      );
    }
    case 'rebus':
    case 'integrame':
    case 'careu':
      return (
        <svg viewBox="0 0 120 120" className={common} aria-hidden="true">
          <rect x="4" y="4" width="112" height="112" rx="8" className="fill-surface stroke-border" />
          {Array.from({ length: 25 }, (_, i) => {
            const r = Math.floor(i / 5);
            const c = i % 5;
            const black = [1, 6, 7, 13, 18, 23].includes(i);
            return <rect key={i} x={8 + c * 21.6} y={8 + r * 21.6} width="20" height="20" rx="2" className={black ? 'fill-text/80' : 'fill-surface stroke-border'} />;
          })}
        </svg>
      );
    case 'cuvinte-ascunse':
      return (
        <svg viewBox="0 0 120 120" className={common} aria-hidden="true">
          <rect x="4" y="4" width="112" height="112" rx="8" className="fill-surface stroke-border" />
          <rect x="10" y="34" width="100" height="20" rx="4" className="fill-cuvinte/20" />
          {'RAMONA'.split('').map((ch, i) => (
            <text key={i} x={20 + i * 16} y={26} className="fill-text/60" fontSize="12" fontWeight="600" textAnchor="middle">{ch}</text>
          ))}
          {'VARA'.split('').map((ch, i) => (
            <text key={i} x={30 + i * 16} y={50} className="fill-cuvinte" fontSize="12" fontWeight="700" textAnchor="middle">{ch}</text>
          ))}
          {'SOARE'.split('').map((ch, i) => (
            <text key={i} x={24 + i * 16} y={74} className="fill-text/60" fontSize="12" fontWeight="600" textAnchor="middle">{ch}</text>
          ))}
        </svg>
      );
    case 'nonograma':
      return (
        <svg viewBox="0 0 120 120" className={common} aria-hidden="true">
          <rect x="4" y="4" width="112" height="112" rx="8" className="fill-surface stroke-border" />
          {[[1, 1], [1, 2], [2, 1], [2, 2], [2, 3], [3, 2], [0, 3]].map(([r, c], i) => (
            <rect key={i} x={40 + (c as number) * 18} y={20 + (r as number) * 18} width="16" height="16" rx="2" className="fill-nonograme" />
          ))}
        </svg>
      );
    case 'provocare-rapida':
      return (
        <svg viewBox="0 0 120 120" className={common} aria-hidden="true">
          {['M', 'I', 'N', 'T', 'E'].map((ch, i) => (
            <g key={i}>
              <rect x={6 + i * 22} y={40} width="20" height="20" rx="3" className={i === 0 ? 'fill-labirint' : i === 4 ? 'fill-labirint' : 'fill-surface-2'} />
              <text x={16 + i * 22} y={55} className={i === 0 || i === 4 ? 'fill-white' : 'fill-text'} fontSize="13" fontWeight="700" textAnchor="middle">{ch}</text>
            </g>
          ))}
          {['C', 'A', 'R', 'E', 'U'].map((ch, i) => (
            <g key={i}>
              <rect x={6 + i * 22} y={64} width="20" height="20" rx="3" className="fill-surface-2" />
              <text x={16 + i * 22} y={79} className="fill-text" fontSize="13" fontWeight="700" textAnchor="middle">{ch}</text>
            </g>
          ))}
        </svg>
      );
    case 'labirint':
      return (
        <svg viewBox="0 0 120 120" className={common} fill="none" stroke="rgb(var(--c-labirint))" strokeWidth="4" aria-hidden="true">
          <rect x="8" y="8" width="104" height="104" rx="8" className="stroke-border" strokeWidth="2" />
          <path d="M20 20v40h30V30h40v60H40v-20" strokeLinecap="round" />
        </svg>
      );
    case 'kakuro':
      return (
        <svg viewBox="0 0 120 120" className={common} aria-hidden="true">
          <rect x="4" y="4" width="112" height="112" rx="8" className="fill-surface stroke-border" />
          <path d="M8 8h32v32H8z" className="fill-surface-2" />
          <line x1="8" y1="8" x2="40" y2="40" className="stroke-border" strokeWidth="1.5" />
          <text x="30" y="20" className="fill-text" fontSize="10" fontWeight="700">17</text>
          <text x="14" y="36" className="fill-text" fontSize="10" fontWeight="700">9</text>
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 120 120" className={common} aria-hidden="true">
          <rect x="4" y="4" width="112" height="112" rx="8" className="fill-surface stroke-border" />
        </svg>
      );
  }
}
