import type { GroupShape } from './GroupShape';
import { nonNegative } from './Numbers';

export abstract class Shape {
  parent: GroupShape | null = null;
  protected readonly style = new Map<string, string>();

  protected constructor(public readonly id: string) {
    if (!id || /\s/.test(id)) throw new Error(`invalid id: ${id}`);
  }

  abstract get type(): string;
  abstract move(dx: number, dy: number): void;
  abstract scale(factor: number): void;
  abstract clone(): Shape;
  abstract summary(): string;

  setAttribute(attr: string, value: string): void {
    if (attr === 'fill' || attr === 'stroke') {
      if (!value) throw new Error(`invalid ${attr}: empty value`);
      this.style.set(attr, value);
    } else if (attr === 'stroke-width') {
      nonNegative(Number(value), attr);
      this.style.set(attr, value);
    } else {
      throw new Error(`unknown attribute: ${attr}`);
    }
  }

  getAttribute(attr: string): string | undefined {
    return this.style.get(attr);
  }

  attributes(): ReadonlyArray<readonly [string, string]> {
    return [...this.style];
  }

  protected copyStyleTo(target: Shape): void {
    for (const [key, value] of this.style) target.style.set(key, value);
  }

  protected styleSummary(): string {
    return [...this.style].map(([key, value]) => ` ${key}=${value}`).join('');
  }
}
