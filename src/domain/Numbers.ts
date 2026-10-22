export function finite(value: number, name: string): number {
  if (!Number.isFinite(value)) throw new Error(`invalid ${name}: must be finite`);
  return value;
}

export function positive(value: number, name: string): number {
  finite(value, name);
  if (value <= 0) throw new Error(`invalid ${name}: must be positive`);
  return value;
}

export function nonNegative(value: number, name: string): number {
  finite(value, name);
  if (value < 0) throw new Error(`invalid ${name}: must be non-negative`);
  return value;
}

export function numberText(value: number): string {
  return String(Object.is(value, -0) ? 0 : Number(value.toPrecision(12)));
}

export function parseNumber(value: string, name: string): number {
  if (value.trim() === '') throw new Error(`invalid ${name}: expected number`);
  return finite(Number(value), name);
}

