import { Shape } from './Shape';
import { finite, numberText, parseNumber, positive } from './Numbers';

export class TextShape extends Shape {
  constructor(id: string, private x: number, private y: number, private content: string) {
    super(id);
    finite(x, 'x'); finite(y, 'y');
  }

  get type(): string { return 'text'; }
  get textContent(): string { return this.content; }
  move(dx: number, dy: number): void { this.x += finite(dx, 'dx'); this.y += finite(dy, 'dy'); }
  scale(factor: number): void { positive(factor, 'scale factor'); this.x *= factor; this.y *= factor; }

  setAttribute(attr: string, value: string): void {
    switch (attr) {
      case 'x': this.x = parseNumber(value, attr); break;
      case 'y': this.y = parseNumber(value, attr); break;
      case 'text': this.content = value; break;
      default: super.setAttribute(attr, value);
    }
  }

  clone(): TextShape {
    const copy = new TextShape(this.id, this.x, this.y, this.content);
    this.copyStyleTo(copy); return copy;
  }

  summary(): string {
    return `text#${this.id} (${numberText(this.x)},${numberText(this.y)}) "${this.content}"${this.styleSummary()}`;
  }

  override attributes(): ReadonlyArray<readonly [string, string]> {
    return [['x', numberText(this.x)], ['y', numberText(this.y)], ...super.attributes()];
  }
}
