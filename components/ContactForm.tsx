'use client';

import { useState } from 'react';

/**
 * Static-friendly contact/suggestion form: composes a `mailto:` link so the
 * visitor's own mail client sends the message. No backend, no data collected by
 * us. `kind` tweaks the subject/labels.
 */
export function ContactForm({ kind = 'contact', to = 'contact@careu.ro' }: { kind?: 'contact' | 'suggestion'; to?: string }) {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const subject = kind === 'suggestion' ? 'Sugestie Careu.ro' : 'Mesaj Careu.ro';

  const mailto = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
    `${message}\n\n— ${name || 'Un vizitator'}`,
  )}`;

  return (
    <form
      className="grid gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        window.location.href = mailto;
      }}
    >
      <label className="grid gap-1 text-sm">
        <span className="font-medium">Numele tău (opțional)</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-brand"
          placeholder="Ion Popescu"
        />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="font-medium">{kind === 'suggestion' ? 'Sugestia ta' : 'Mesajul tău'}</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={5}
          className="rounded-lg border border-border bg-surface px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-brand"
          placeholder={kind === 'suggestion' ? 'Mi-ar plăcea un joc de...' : 'Bună ziua, ...'}
        />
      </label>
      <div className="flex items-center gap-3">
        <button type="submit" className="btn-brand w-fit">
          Trimite prin email
        </button>
        <span className="text-xs text-muted">Se deschide aplicația ta de email. Nu colectăm date pe server.</span>
      </div>
    </form>
  );
}
