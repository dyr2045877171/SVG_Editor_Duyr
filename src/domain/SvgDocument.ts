import { GroupShape } from './GroupShape';
import { Shape } from './Shape';
import { numberText, positive } from './Numbers';

export class SvgDocument {
  readonly root = new GroupShape('__document_root__');

  constructor(public width = 800, public height = 600) {
    positive(width, 'canvas width'); positive(height, 'canvas height');
  }

  resize(width: number, height: number): void {
    positive(width, 'canvas width'); positive(height, 'canvas height');
    this.width = width; this.height = height;
  }

  clone(): SvgDocument {
    const copy = new SvgDocument(this.width, this.height);
    for (const child of this.root.children) copy.root.append(child.clone());
    return copy;
  }

  allShapes(): Shape[] {
    const result: Shape[] = [];
    const visit = (group: GroupShape): void => {
      for (const child of group.children) {
        result.push(child);
        if (child instanceof GroupShape) visit(child);
      }
    };
    visit(this.root);
    return result;
  }

  find(id: string): Shape | undefined {
    return this.allShapes().find(shape => shape.id === id);
  }

  requireShape(id: string): Shape {
    const shape = this.find(id);
    if (!shape) throw new Error(`no such shape: ${id}`);
    return shape;
  }

  requireContainer(id: string): GroupShape {
    const shape = this.find(id);
    if (!shape) throw new Error(`no such container: ${id}`);
    if (!(shape instanceof GroupShape)) throw new Error(`not a container: ${id}`);
    return shape;
  }

  ensureNewId(id: string): void {
    if (this.find(id)) throw new Error(`id already exists: ${id}`);
  }

  add(shape: Shape, containerId?: string): void {
    this.ensureNewId(shape.id);
    const parent = containerId ? this.requireContainer(containerId) : this.root;
    parent.append(shape);
  }

  delete(id: string): Shape {
    const shape = this.requireShape(id);
    shape.parent!.remove(shape);
    return shape;
  }

  group(newId: string, ids: string[]): GroupShape {
    this.ensureNewId(newId);
    if (ids.length === 0) throw new Error('group requires at least one shape');
    if (new Set(ids).size !== ids.length) throw new Error('duplicate shape in group');
    const selected = ids.map(id => this.requireShape(id));
    for (const shape of selected) {
      if (selected.some(other => other !== shape && this.isAncestor(other, shape))) {
        const ancestor = selected.find(other => other !== shape && this.isAncestor(other, shape))!;
        throw new Error(`cannot group a container into its own descendant: ${ancestor.id}`);
      }
    }
    const order = this.allShapes();
    selected.sort((a, b) => order.indexOf(a) - order.indexOf(b));
    const first = selected[0]!;
    const parent = first.parent!;
    const insertAt = parent.indexOf(first);
    for (const shape of selected) shape.parent!.remove(shape);
    const group = new GroupShape(newId);
    parent.insert(insertAt, group);
    for (const shape of selected) group.append(shape);
    return group;
  }

  ungroup(id: string): void {
    const shape = this.requireShape(id);
    if (!(shape instanceof GroupShape)) throw new Error(`not a container: ${id}`);
    if (shape.parent === this.root) throw new Error(`cannot ungroup top-level container: ${id}`);
    const parent = shape.parent!;
    const index = parent.remove(shape);
    let offset = 0; for (const child of [...shape.children]) {
      shape.remove(child);
      parent.insert(index + offset++, child);
    }
  }

  addTo(containerId: string, id: string): void {
    const parent = this.requireContainer(containerId);
    const shape = this.requireShape(id);
    if (shape === parent || this.isAncestor(shape, parent)) {
      throw new Error(`cannot move a container into its own descendant: ${id}`);
    }
    shape.parent!.remove(shape);
    parent.append(shape);
  }

  front(id: string): void {
    const shape = this.requireShape(id);
    const parent = shape.parent!;
    parent.remove(shape);
    parent.append(shape);
  }

  back(id: string): void {
    const shape = this.requireShape(id);
    const parent = shape.parent!;
    parent.remove(shape);
    parent.insert(0, shape);
  }

  tree(id?: string): string {
    if (id) {
      const shape = this.requireShape(id);
      return [shape.summary(), ...this.childLines(shape, '')].join('\n');
    }
    const lines = [`svg (${numberText(this.width)}x${numberText(this.height)})`];
    const children = this.root.children;
    children.forEach((child, index) => {
      const last = index === children.length - 1;
      lines.push(`${last ? '└──' : '├──'} ${child.summary()}`);
      lines.push(...this.childLines(child, last ? '    ' : '│   '));
    });
    return lines.join('\n');
  }

  show(id: string): string {
    const shape = this.requireShape(id);
    const parent = shape.parent === this.root ? 'svg' : `g#${shape.parent!.id}`;
    return `${shape.summary()} parent=${parent}`;
  }

  private childLines(shape: Shape, indent: string): string[] {
    if (!(shape instanceof GroupShape)) return [];
    const lines: string[] = [];
    shape.children.forEach((child, index) => {
      const last = index === shape.children.length - 1;
      lines.push(`${indent}${last ? '└──' : '├──'} ${child.summary()}`);
      lines.push(...this.childLines(child, indent + (last ? '    ' : '│   ')));
    });
    return lines;
  }

  private isAncestor(ancestor: Shape, descendant: Shape): boolean {
    let current = descendant.parent;
    while (current) {
      if (current === ancestor) return true;
      current = current.parent;
    }
    return false;
  }
}


