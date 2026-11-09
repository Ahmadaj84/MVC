/**
 * Request-body helpers: field whitelisting (prevents mass assignment) and
 * basic type validation so malformed records can't break later queries.
 */

export class ValidationError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

/** Copy only whitelisted keys that are present in `body`. */
export function pick<T extends string>(body: unknown, allowed: readonly T[]): Partial<Record<T, unknown>> {
  const out: Partial<Record<T, unknown>> = {};
  if (!body || typeof body !== 'object') return out;
  const src = body as Record<string, unknown>;
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(src, key) && src[key] !== undefined) {
      out[key] = src[key];
    }
  }
  return out;
}

/** Every value in `data` for the given keys must be a string (or absent / null). */
export function assertStrings(data: Record<string, unknown>, keys: readonly string[]) {
  for (const key of keys) {
    const v = data[key];
    if (v !== undefined && v !== null && typeof v !== 'string') {
      throw new ValidationError(`${key} must be a string`);
    }
    if (typeof v === 'string' && v.length > 2000) {
      throw new ValidationError(`${key} is too long`);
    }
  }
}

/** Required keys must be non-empty strings. */
export function assertRequired(data: Record<string, unknown>, keys: readonly string[]) {
  for (const key of keys) {
    const v = data[key];
    if (typeof v !== 'string' || v.trim() === '') {
      throw new ValidationError(`${key} is required`);
    }
  }
}

/** Parse a positive integer ID; throws on anything else. */
export function toId(value: unknown, field: string): number {
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n <= 0) {
    throw new ValidationError(`${field} must be a positive integer`);
  }
  return n;
}

/** Parse a finite, non-negative monetary amount. */
export function toAmount(value: unknown, field: string, { allowZero = true } = {}): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || (!allowZero && n === 0) || n > 1e12) {
    throw new ValidationError(`${field} must be a ${allowZero ? 'non-negative' : 'positive'} finite number`);
  }
  return Math.round(n * 100) / 100;
}

/** Case-insensitive "includes" that tolerates missing / non-string values. */
export function matches(value: unknown, q: string): boolean {
  return typeof value === 'string' && value.toLowerCase().includes(q);
}
