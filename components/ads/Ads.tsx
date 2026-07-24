import { adsConfig } from '@/lib/config';
import { AdUnit } from './AdUnit';

/**
 * Ad placements. In development (or whenever ads are not configured) we render
 * only a sized placeholder — never a real ad. The box always reserves its
 * dimensions so enabling ads later causes no layout shift. The site is fully
 * usable when ads are blocked or disabled.
 */

interface SlotProps {
  className?: string;
}

function Placeholder({ w, h, label }: { w: number; h: number; label: string }) {
  return (
    <div
      className="mx-auto grid place-items-center rounded-xl border border-dashed border-border bg-surface-2 text-muted"
      style={{ maxWidth: w, minHeight: h }}
      role="complementary"
      aria-label="Spațiu publicitar"
    >
      <div className="flex flex-col items-center gap-1 py-4 text-xs font-medium tracking-wide">
        <span>RECLAMĂ</span>
        <span className="tabular-nums">
          {w} × {h}
        </span>
        <span className="sr-only">{label}</span>
      </div>
    </div>
  );
}

export function AdLeaderboard({ className = '' }: SlotProps) {
  return (
    <div className={className} data-ad="leaderboard">
      {adsConfig.enabled ? (
        <AdUnit slotKey="leaderboard" width={728} height={90} />
      ) : (
        <Placeholder w={728} h={90} label="Banner orizontal" />
      )}
    </div>
  );
}

export function AdRectangle({ className = '' }: SlotProps) {
  return (
    <div className={className} data-ad="rectangle">
      {adsConfig.enabled ? (
        <AdUnit slotKey="rectangle" width={300} height={250} />
      ) : (
        <Placeholder w={300} h={250} label="Dreptunghi sidebar" />
      )}
    </div>
  );
}

export function AdMobileBanner({ className = '' }: SlotProps) {
  return (
    <div className={`sm:hidden ${className}`} data-ad="mobile">
      {adsConfig.enabled ? (
        <AdUnit slotKey="mobile" width={320} height={100} />
      ) : (
        <Placeholder w={320} h={100} label="Banner mobil" />
      )}
    </div>
  );
}

export function AdInContent({ className = '' }: SlotProps) {
  return (
    <div className={className} data-ad="in-content">
      {adsConfig.enabled ? (
        <AdUnit slotKey="inContent" width={336} height={280} />
      ) : (
        <Placeholder w={336} h={280} label="Reclamă în conținut" />
      )}
    </div>
  );
}
