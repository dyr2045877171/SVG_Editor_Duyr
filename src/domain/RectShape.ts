import { Shape } from './Shape';
import { finite, numberText, parseNumber, positive } from './Numbers';
import { escapeXml } from './Xml';

export class RectShape extends Shape {
  constructor(id: string, private x: number, private y: number,
    private width: number, private height: number) {
    super(id);
    finite(x, 'x'); finite(y, 'y'); positive(width, 'width'); positive(height, 'height');
  }

  get type(): string { return 'rect'; }
  move(dx: number, dy: number): void { this.x += finite(dx, 'dx'); this.y += finite(dy, 'dy'); }
  scale(factor: number): void {
    positive(factor, 'scale factor');
    this.x *= factor; this.y *= factor; this.width *= factor; this.height *= factor;
  }

  setAttribute(attr: string, value: string): void {
    const n = ['x', 'y', 'width', 'height'].includes(attr) ? parseNumber(value, attr) : undefined;
    switch (attr) {
      case 'x': this.x = n!; break;
      case 'y': this.y = n!; break;
      case 'width': this.width = positive(n!, attr); break;
      case 'height': this.height = positive(n!, attr); break;
      default: super.setAttribute(attr, value);
    }
  }

  clone(): RectShape {
    const copy = new RectShape(this.id, this.x, this.y, this.width, this.height);
    this.copyStyleTo(copy); return copy;
  }

  summary(): string {
    return `rect#${this.id} x=${numberText(this.x)} y=${numberText(this.y)} w=${numberText(this.width)} h=${numberText(this.height)}${this.styleSummary()}`;
  }

  toSvg(depth: number): string {
    return `${this.prefix(depth)}<rect id="${escapeXml(this.id)}" x="${numberText(this.x)}" y="${numberText(this.y)}" width="${numberText(this.width)}" height="${numberText(this.height)}"${this.styleXml()}/>`;
  }
}

