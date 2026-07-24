'use client';

import { useEffect, useState } from 'react';
import { usePreferences } from '@/lib/client/usePreferences';
import { clearAllProgress, resetStats, getStats, getStreak, type Stats, type Streak } from '@/lib/client/progress';
import { formatDuration } from '@/lib/client/format';

function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description: string }) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-xl border border-border bg-surface p-4">
      <span>
        <span className="block font-semibold">{label}</span>
        <span className="block text-sm text-muted">{description}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative mt-1 h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-brand' : 'bg-border-strong'}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </label>
  );
}

export function SettingsPanel() {
  const { prefs, update, resolvedTheme } = usePreferences();
  const [stats, setStats] = useState<Stats | null>(null);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    setStats(getStats());
    setStreak(getStreak());
  }, []);

  const refresh = () => {
    setStats(getStats());
    setStreak(getStreak());
  };

  return (
    <div className="grid gap-6">
      <section>
        <h2 className="text-lg font-bold">Aspect</h2>
        <div className="mt-3 grid gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-surface p-4">
            <span className="flex-1 font-semibold">Temă</span>
            {(['light', 'dark', 'system'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => update({ theme: t })}
                aria-pressed={prefs.theme === t}
                className={`btn ${prefs.theme === t ? 'bg-brand text-white' : 'btn-ghost'}`}
              >
                {t === 'light' ? 'Luminos' : t === 'dark' ? 'Întunecat' : 'Sistem'}
              </button>
            ))}
          </div>
          <Toggle
            checked={prefs.highContrast}
            onChange={(v) => update({ highContrast: v })}
            label="Contrast ridicat"
            description="Margini și text mai puternice pentru lizibilitate."
          />
          <Toggle
            checked={prefs.reduceMotion}
            onChange={(v) => update({ reduceMotion: v })}
            label="Reducerea animațiilor"
            description="Dezactivează tranzițiile și animațiile."
          />
        </div>
        <p className="mt-2 text-xs text-muted">Temă activă acum: {resolvedTheme === 'dark' ? 'întunecată' : 'luminoasă'}.</p>
      </section>

      <section>
        <h2 className="text-lg font-bold">Statistici locale</h2>
        {stats && streak && (
          <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Jocuri terminate" value={String(stats.gamesCompleted)} />
            <Stat label="Serie curentă" value={`${streak.current} zile`} />
            <Stat label="Cea mai lungă serie" value={`${streak.longest} zile`} />
            <Stat label="Timp total" value={formatDuration(stats.totalTimeMs)} />
          </dl>
        )}
      </section>

      <section>
        <h2 className="text-lg font-bold">Gestionează datele</h2>
        <p className="mt-1 text-sm text-muted">
          Progresul este păstrat doar pe acest dispozitiv și nu se sincronizează între dispozitive.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              if (window.confirm('Ștergi tot progresul jocurilor de pe acest dispozitiv?')) {
                clearAllProgress();
                setMsg('Progresul a fost șters.');
                refresh();
              }
            }}
          >
            Șterge progresul
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              if (window.confirm('Resetezi statisticile și seria zilnică?')) {
                resetStats();
                setMsg('Statisticile au fost resetate.');
                refresh();
              }
            }}
          >
            Resetează statisticile
          </button>
        </div>
        {msg && <p className="mt-3 text-sm text-labirint" role="status">{msg}</p>}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3 text-center">
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}
