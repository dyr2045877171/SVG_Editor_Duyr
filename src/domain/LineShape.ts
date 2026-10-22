import { Shape } from './Shape';
import { finite, numberText, parseNumber, positive } from './Numbers';
import { escapeXml } from './Xml';

export class LineShape extends Shape {
  constructor(id: string, private x1: number, private y1: number,
    private x2: number, private y2: number) {
    super(id);
    finite(x1, 'x1'); finite(y1, 'y1'); finite(x2, 'x2'); finite(y2, 'y2');
  }

  get type(): string { return 'line'; }
  move(dx: number, dy: number): void {
    finite(dx, 'dx'); finite(dy, 'dy');
    this.x1 += dx; this.y1 += dy; this.x2 += dx; this.y2 += dy;
  }
  scale(factor: number): void {
    positive(factor, 'scale factor');
    this.x1 *= factor; this.y1 *= factor; this.x2 *= factor; this.y2 *= factor;
  }

  setAttribute(attr: string, value: string): void {
    const n = ['x1', 'y1', 'x2', 'y2'].includes(attr) ? parseNumber(value, attr) : undefined;
    switch (attr) {
      case 'x1': this.x1 = n!; break;
      case 'y1': this.y1 = n!; break;
      case 'x2': this.x2 = n!; break;
      case 'y2': this.y2 = n!; break;
      default: super.setAttribute(attr, value);
    }
  }

  clone(): LineShape {
    const copy = new LineShape(this.id, this.x1, this.y1, this.x2, this.y2);
    this.copyStyleTo(copy); return copy;
  }

  summary(): string {
    return `line#${this.id} (${numberText(this.x1)},${numberText(this.y1)}) -> (${numberText(this.x2)},${numberText(this.y2)})${this.styleSummary()}`;
  }

  toSvg(depth: number): string {
    return `${this.prefix(depth)}<line id="${escapeXml(this.id)}" x1="${numberText(this.x1)}" y1="${numberText(this.y1)}" x2="${numberText(this.x2)}" y2="${numberText(this.y2)}"${this.styleXml()}/>`;
  }
}

