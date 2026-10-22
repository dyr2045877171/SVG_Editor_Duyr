import { Shape } from './Shape';
import { positive } from './Numbers';
import { escapeXml } from './Xml';

export class GroupShape extends Shape {
  constructor(id: string) { super(id); }
  private readonly items: Shape[] = [];

  get type(): string { return 'g'; }
  get children(): readonly Shape[] { return this.items; }

  insert(index: number, shape: Shape): void {
    if (shape.parent) throw new Error(`shape already has a parent: ${shape.id}`);
    if (index < 0 || index > this.items.length) throw new Error('invalid child index');
    this.items.splice(index, 0, shape);
    shape.parent = this;
  }

  append(shape: Shape): void { this.insert(this.items.length, shape); }

  remove(shape: Shape): number {
    const index = this.items.indexOf(shape);
    if (index < 0) throw new Error(`shape is not a child: ${shape.id}`);
    this.items.splice(index, 1);
    shape.parent = null;
    return index;
  }

  indexOf(shape: Shape): number { return this.items.indexOf(shape); }

  move(dx: number, dy: number): void {
    for (const child of this.items) child.move(dx, dy);
  }

  scale(factor: number): void {
    positive(factor, 'scale factor');
    for (const child of this.items) child.scale(factor);
  }

  clone(): GroupShape {
    const copy = new GroupShape(this.id);
    this.copyStyleTo(copy);
    for (const child of this.items) copy.append(child.clone());
    return copy;
  }

  summary(): string { return `g#${this.id}${this.styleSummary()}`; }

  toSvg(depth: number): string {
    const open = `${this.prefix(depth)}<g id="${escapeXml(this.id)}"${this.styleXml()}`;
    if (this.items.length === 0) return `${open}/>`;
    return `${open}>\n${this.items.map(child => child.toSvg(depth + 1)).join('\n')}\n${this.prefix(depth)}</g>`;
  }
}


