import { Shape } from './Shape';
import { finite, numberText, parseNumber, positive } from './Numbers';

export class CircleShape extends Shape {
  constructor(id: string, private cx: number, private cy: number, private r: number) {
    super(id);
    finite(cx, 'cx'); finite(cy, 'cy'); positive(r, 'r');
  }

  get type(): string { return 'circle'; }
  move(dx: number, dy: number): void { this.cx += finite(dx, 'dx'); this.cy += finite(dy, 'dy'); }
  scale(factor: number): void {
    positive(factor, 'scale factor');
    this.cx *= factor; this.cy *= factor; this.r *= factor;
  }

  setAttribute(attr: string, value: string): void {
    const n = ['cx', 'cy', 'r'].includes(attr) ? parseNumber(value, attr) : undefined;
    switch (attr) {
      case 'cx': this.cx = n!; break;
      case 'cy': this.cy = n!; break;
      case 'r': this.r = positive(n!, attr); break;
      default: super.setAttribute(attr, value);
    }
  }

  clone(): CircleShape {
    const copy = new CircleShape(this.id, this.cx, this.cy, this.r);
    this.copyStyleTo(copy); return copy;
  }

  summary(): string {
    return `circle#${this.id} cx=${numberText(this.cx)} cy=${numberText(this.cy)} r=${numberText(this.r)}${this.styleSummary()}`;
  }

  override attributes(): ReadonlyArray<readonly [string, string]> {
    return [['cx', numberText(this.cx)], ['cy', numberText(this.cy)],
      ['r', numberText(this.r)], ...super.attributes()];
  }
}
