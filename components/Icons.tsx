import type { GameType } from '@/lib/schema/common';

type IconProps = { className?: string };

/** PauzaLogica.ro logo mark — a navy crossword tile with one amber cell. */
export function Logo({ className = 'h-8 w-8' }: IconProps) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      {/* Tile lightens slightly in dark mode so it stays crisp on the dark header. */}
      <rect x="8" y="8" width="84" height="84" rx="22" className="fill-[#1b2a4a] dark:fill-[#28395c]" />
      <g fill="#ffffff">
        <rect x="18" y="18" width="18" height="18" rx="3" />
        <rect x="41" y="18" width="18" height="18" rx="3" />
        <rect x="18" y="41" width="18" height="18" rx="3" />
        <rect x="41" y="41" width="18" height="18" rx="3" />
        <rect x="64" y="41" width="18" height="18" rx="3" />
        <rect x="18" y="64" width="18" height="18" rx="3" />
        <rect x="41" y="64" width="18" height="18" rx="3" />
        <rect x="64" y="64" width="18" height="18" rx="3" />
      </g>
      {/* amber accent cell, top-right */}
      <rect x="64" y="18" width="18" height="18" rx="3" fill="#e6a92c" />
    </svg>
  );
}

export function SunIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

export function MoonIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}

export function ChevronDown({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function ChevronRight({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function ClockIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export function CalendarIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

export function MenuIcon({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  );
}

export function CloseIcon({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function BoltIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M13 2 3 14h7l-1 8 10-12h-7z" />
    </svg>
  );
}

export function StarIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 2l3 6.5 7 .6-5.3 4.6L18.2 22 12 18.3 5.8 22l1.5-8.3L2 9.1l7-.6z" />
    </svg>
  );
}

export function ControllerIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 12h4M8 10v4" />
      <circle cx="15" cy="11" r="1" />
      <circle cx="17.5" cy="13.5" r="1" />
      <rect x="2" y="6" width="20" height="12" rx="4" />
    </svg>
  );
}

export function TrendingIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 17l6-6 4 4 7-7" />
      <path d="M17 8h4v4" />
    </svg>
  );
}

/** A tiny per-game glyph used on cards and lists. */
export function GameGlyph({ type, className = 'h-6 w-6' }: { type: GameType; className?: string }) {
  const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
  switch (type) {
    case 'sudoku':
    case 'nonograma':
    case 'integrame':
    case 'careu':
    case 'cuvinte-ascunse':
      return (
        <svg viewBox="0 0 24 24" className={className} {...stroke} aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
        </svg>
      );
    case 'kakuro':
      return (
        <svg viewBox="0 0 24 24" className={className} {...stroke} aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 3l6 6M3 9h6M9 3v6" />
        </svg>
      );
    case 'labirint':
      return (
        <svg viewBox="0 0 24 24" className={className} {...stroke} aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M7 3v10h6M17 7v10H7M11 17v4" />
        </svg>
      );
    case 'anagrame':
      return (
        <svg viewBox="0 0 24 24" className={className} {...stroke} aria-hidden="true">
          <rect x="3" y="4" width="8" height="8" rx="1.5" />
          <rect x="13" y="12" width="8" height="8" rx="1.5" />
          <path d="M11 8h2v4" />
        </svg>
      );
    case 'rebus':
    case 'provocare-rapida':
    case 'secvente-logice':
    case 'cuvant-misterios':
    default:
      return (
        <svg viewBox="0 0 24 24" className={className} {...stroke} aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M7 9h4M7 13h10M13 9h4" />
        </svg>
      );
  }
}
