import { Shape } from './Shape';
import { finite, numberText, parseNumber, positive } from './Numbers';
import { escapeXml } from './Xml';

export class EllipseShape extends Shape {
  constructor(id: string, private cx: number, private cy: number,
    private rx: number, private ry: number) {
    super(id);
    finite(cx, 'cx'); finite(cy, 'cy'); positive(rx, 'rx'); positive(ry, 'ry');
  }

  get type(): string { return 'ellipse'; }
  move(dx: number, dy: number): void { this.cx += finite(dx, 'dx'); this.cy += finite(dy, 'dy'); }
  scale(factor: number): void {
    positive(factor, 'scale factor');
    this.cx *= factor; this.cy *= factor; this.rx *= factor; this.ry *= factor;
  }

  setAttribute(attr: string, value: string): void {
    const n = ['cx', 'cy', 'rx', 'ry'].includes(attr) ? parseNumber(value, attr) : undefined;
    switch (attr) {
      case 'cx': this.cx = n!; break;
      case 'cy': this.cy = n!; break;
      case 'rx': this.rx = positive(n!, attr); break;
      case 'ry': this.ry = positive(n!, attr); break;
      default: super.setAttribute(attr, value);
    }
  }

  clone(): EllipseShape {
    const copy = new EllipseShape(this.id, this.cx, this.cy, this.rx, this.ry);
    this.copyStyleTo(copy); return copy;
  }

  summary(): string {
    return `ellipse#${this.id} cx=${numberText(this.cx)} cy=${numberText(this.cy)} rx=${numberText(this.rx)} ry=${numberText(this.ry)}${this.styleSummary()}`;
  }

  toSvg(depth: number): string {
    return `${this.prefix(depth)}<ellipse id="${escapeXml(this.id)}" cx="${numberText(this.cx)}" cy="${numberText(this.cy)}" rx="${numberText(this.rx)}" ry="${numberText(this.ry)}"${this.styleXml()}/>`;
  }
}

