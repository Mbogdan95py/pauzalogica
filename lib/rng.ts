/**
 * Deterministic, seedable pseudo-random number generator.
 *
 * The entire content pipeline is reproducible: given the same seed string, the
 * same puzzles are produced on any machine. We use a small, fast, well-known
 * algorithm (mulberry32) fed by a string hash (cyrb128). No crypto strength is
 * needed — only reproducibility and reasonable distribution.
 */

/** Hash an arbitrary string into four 32-bit seeds (cyrb128 by bryc). */
export function cyrb128(str: string): [number, number, number, number] {
  let h1 = 1779033703;
  let h2 = 3144134277;
  let h3 = 1013904242;
  let h4 = 2773480762;
  for (let i = 0; i < str.length; i++) {
    const k = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  return [
    (h1 ^ h2 ^ h3 ^ h4) >>> 0,
    (h2 ^ h1) >>> 0,
    (h3 ^ h1) >>> 0,
    (h4 ^ h1) >>> 0,
  ];
}

/** mulberry32 PRNG — returns a function producing floats in [0, 1). */
function mulberry32(a: number): () => number {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Rng {
  /** float in [0, 1) */
  next(): number;
  /** integer in [min, max] inclusive */
  int(min: number, max: number): number;
  /** float in [min, max) */
  float(min: number, max: number): number;
  /** true with the given probability (default 0.5) */
  bool(probability?: number): boolean;
  /** random element of a non-empty array */
  pick<T>(items: readonly T[]): T;
  /** in-place Fisher–Yates shuffle; returns the same array */
  shuffle<T>(items: T[]): T[];
  /** a fresh shuffled copy, leaving the input untouched */
  shuffled<T>(items: readonly T[]): T[];
  /** k distinct elements sampled without replacement */
  sample<T>(items: readonly T[], k: number): T[];
  /** derive an independent child RNG from a sub-seed label */
  derive(label: string): Rng;
}

export function createRng(seed: string | number): Rng {
  const seedStr = typeof seed === 'number' ? String(seed) : seed;
  const [a] = cyrb128(seedStr);
  const gen = mulberry32(a);

  const rng: Rng = {
    next: gen,
    int(min: number, max: number): number {
      if (max < min) [min, max] = [max, min];
      return Math.floor(gen() * (max - min + 1)) + min;
    },
    float(min: number, max: number): number {
      return gen() * (max - min) + min;
    },
    bool(probability = 0.5): boolean {
      return gen() < probability;
    },
    pick<T>(items: readonly T[]): T {
      if (items.length === 0) throw new Error('createRng.pick: empty array');
      return items[Math.floor(gen() * items.length)]!;
    },
    shuffle<T>(items: T[]): T[] {
      for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(gen() * (i + 1));
        [items[i], items[j]] = [items[j]!, items[i]!];
      }
      return items;
    },
    shuffled<T>(items: readonly T[]): T[] {
      return rng.shuffle([...items]);
    },
    sample<T>(items: readonly T[], k: number): T[] {
      return rng.shuffled(items).slice(0, Math.max(0, Math.min(k, items.length)));
    },
    derive(label: string): Rng {
      return createRng(`${seedStr}::${label}`);
    },
  };
  return rng;
}

/**
 * Build a stable seed string from parts. Order matters; all parts are coerced
 * to strings and joined so the same inputs always yield the same seed.
 */
export function makeSeed(...parts: Array<string | number>): string {
  return parts.map((p) => String(p)).join(':');
}
