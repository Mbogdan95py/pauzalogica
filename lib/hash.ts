import { createHash } from 'node:crypto';

/**
 * Content hashing helpers. Used by the generation pipeline and validators to
 * fingerprint packages and individual puzzles for the dedup archive. Node-only
 * (imported from scripts/validators, never from client components).
 */

/**
 * Deterministic JSON serialization: object keys are emitted in sorted order at
 * every depth so that two structurally-equal objects always hash identically,
 * regardless of key insertion order.
 */
export function stableStringify(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      out[key] = sortValue((value as Record<string, unknown>)[key]);
    }
    return out;
  }
  return value;
}

export function sha256Hex(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

/** SHA-256 of the deterministic serialization of an object. */
export function hashObject(value: unknown): string {
  return sha256Hex(stableStringify(value));
}

/** A short, human-friendly fingerprint (first 12 hex chars). */
export function shortHash(value: unknown): string {
  return hashObject(value).slice(0, 12);
}
