import { readFileSync, writeFileSync } from 'node:fs';
import { DOMParser, type Element } from '@xmldom/xmldom';
import { ShapeFactory } from '../../application/ShapeFactory';
import { SvgReadResult, SvgStore } from '../../application/ports/SvgStore';
import { GroupShape } from '../../domain/GroupShape';
import { Shape } from '../../domain/Shape';
import { SvgDocument } from '../../domain/SvgDocument';
import { parseNumber } from '../../domain/Numbers';

export class SvgFileStore implements SvgStore {
  constructor(private readonly factory = new ShapeFactory()) {}

  read(filePath: string): SvgReadResult {
    let xml: string;
    try {
      xml = readFileSync(filePath, 'utf8');
    } catch {
      throw new Error(`cannot read file: ${filePath}`);
    }
    const parser = new DOMParser({
      onError: (_level, message) => { throw new Error(`invalid SVG: ${message}`); }
    });
    const dom = parser.parseFromString(xml, 'image/svg+xml');
    const root = dom.documentElement;
    if (!root || this.tag(root) !== 'svg') throw new Error('invalid SVG: missing <svg> root');
    const viewBox = root.getAttribute('viewBox')?.trim().split(/[\s,]+/) ?? [];
    const width = parseNumber(root.getAttribute('width') ?? viewBox[2] ?? '', 'canvas width');
    const height = parseNumber(root.getAttribute('height') ?? viewBox[3] ?? '', 'canvas height');
    const document = new SvgDocument(width, height);
    const reserved = new Set<string>();
    const elements: Element[] = [];
    const collect = (element: Element): void => {
      for (let node = element.firstChild; node; node = node.nextSibling) {
        if (node.nodeType !== 1) continue;
        const child = node as Element;
        elements.push(child);
        collect(child);
      }
    };
    collect(root);
    for (const element of elements) {
      const id = element.getAttribute('id');
      if (!id) continue;
      if (reserved.has(id)) throw new Error(`id already exists: ${id}`);
      reserved.add(id);
    }
    const assigned = new Set<string>();
    const counters = new Map<string, number>();
    const warnings: string[] = [];
    const parseChildren = (element: Element, parent: GroupShape): void => {
      for (let node = element.firstChild; node; node = node.nextSibling) {
        if (node.nodeType !== 1) continue;
        const child = node as Element;
        const tag = this.tag(child);
        let id = child.getAttribute('id');
        if (!id) {
          let number = counters.get(tag) ?? 0;
          do { number += 1; id = `${tag}${number}`; } while (reserved.has(id) || assigned.has(id));
          counters.set(tag, number);
          warnings.push(`warning: assigned id ${id} to unnamed <${tag}>`);
        }
        assigned.add(id);
        const shape = this.parseShape(tag, id, child);
        parent.append(shape);
        if (shape instanceof GroupShape) {
          parseChildren(child, shape);
          this.applyTransform(shape, child.getAttribute('transform'));
        } else if (child.hasAttribute('transform')) {
          throw new Error(`unsupported SVG transform on <${tag}>`);
        }
      }
    };
    parseChildren(root, document.root);
    return { document, warnings };
  }

  write(filePath: string, document: SvgDocument): void {
    try {
      writeFileSync(filePath, document.toSvg(), 'utf8');
    } catch {
      throw new Error(`cannot write file: ${filePath}`);
    }
  }

  private parseShape(tag: string, id: string, element: Element): Shape {
    const attr = (name: string, fallback?: string): string => element.getAttribute(name) ?? fallback ?? '';
    let args: string[];
    switch (tag) {
      case 'rect': args = [attr('x', '0'), attr('y', '0'), attr('width'), attr('height')]; break;
      case 'circle': args = [attr('cx', '0'), attr('cy', '0'), attr('r')]; break;
      case 'ellipse': args = [attr('cx', '0'), attr('cy', '0'), attr('rx'), attr('ry')]; break;
      case 'line': args = [attr('x1', '0'), attr('y1', '0'), attr('x2', '0'), attr('y2', '0')]; break;
      case 'text': args = [attr('x', '0'), attr('y', '0'), element.textContent ?? '']; break;
      case 'g': args = []; break;
      default: throw new Error(`unsupported SVG element: <${tag}>`);
    }
    const shape = this.factory.create(tag, id, args);
    for (const style of ['fill', 'stroke', 'stroke-width']) {
      const value = element.getAttribute(style);
      if (value !== null) shape.setAttribute(style, value);
    }
    return shape;
  }

  private applyTransform(group: GroupShape, transform: string | null): void {
    if (!transform?.trim()) return;
    const operations = [...transform.matchAll(/(translate|scale)\s*\(([^)]*)\)/g)];
    const remainder = transform.replace(/(translate|scale)\s*\(([^)]*)\)/g, '').trim();
    if (remainder || operations.length === 0) throw new Error(`unsupported SVG transform: ${transform}`);
    for (const operation of operations.reverse()) {
      const values = operation[2]!.trim().split(/[\s,]+/).map((value, index) => parseNumber(value, `transform argument ${index + 1}`));
      if (operation[1] === 'translate' && values.length >= 1 && values.length <= 2) {
        group.move(values[0]!, values[1] ?? 0);
      } else if (operation[1] === 'scale' && values.length === 1) {
        group.scale(values[0]!);
      } else {
        throw new Error(`unsupported SVG transform: ${transform}`);
      }
    }
  }

  private tag(element: Element): string {
    return (element.localName || element.tagName).split(':').pop()!;
  }
}


