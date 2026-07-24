import { describe, it, expect } from 'vitest';
import { stableStringify, hashObject, shortHash } from '@/lib/hash';

describe('hashing', () => {
  it('stableStringify is key-order independent', () => {
    expect(stableStringify({ a: 1, b: 2 })).toBe(stableStringify({ b: 2, a: 1 }));
    expect(stableStringify({ a: { x: 1, y: 2 } })).toBe(stableStringify({ a: { y: 2, x: 1 } }));
  });

  it('hashObject is stable across key order', () => {
    expect(hashObject({ a: 1, b: [1, 2, 3] })).toBe(hashObject({ b: [1, 2, 3], a: 1 }));
  });

  it('differs for different content', () => {
    expect(hashObject({ a: 1 })).not.toBe(hashObject({ a: 2 }));
  });

  it('array order matters', () => {
    expect(hashObject([1, 2, 3])).not.toBe(hashObject([3, 2, 1]));
  });

  it('shortHash is 12 hex chars', () => {
    expect(shortHash({ x: 1 })).toMatch(/^[0-9a-f]{12}$/);
  });
});
