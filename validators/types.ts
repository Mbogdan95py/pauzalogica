/**
 * Shared validator result. Every game validator is an INDEPENDENT module from
 * its generator: it re-derives correctness (re-solving, re-checking uniqueness,
 * dictionary membership, etc.) rather than trusting the generator's own claims.
 */
export interface ValidatorResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

export function ok(warnings: string[] = []): ValidatorResult {
  return { ok: true, errors: [], warnings };
}

export function fail(errors: string[], warnings: string[] = []): ValidatorResult {
  return { ok: false, errors, warnings };
}

/** Collect assertions imperatively, then materialize a result. */
export class Checker {
  private errors: string[] = [];
  private warnings: string[] = [];

  assert(condition: boolean, message: string): this {
    if (!condition) this.errors.push(message);
    return this;
  }

  warn(condition: boolean, message: string): this {
    if (!condition) this.warnings.push(message);
    return this;
  }

  addError(message: string): this {
    this.errors.push(message);
    return this;
  }

  result(): ValidatorResult {
    return { ok: this.errors.length === 0, errors: this.errors, warnings: this.warnings };
  }
}

export function mergeResults(results: ValidatorResult[]): ValidatorResult {
  return {
    ok: results.every((r) => r.ok),
    errors: results.flatMap((r) => r.errors),
    warnings: results.flatMap((r) => r.warnings),
  };
}
