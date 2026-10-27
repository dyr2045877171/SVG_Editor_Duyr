import { readFileSync, writeFileSync } from 'node:fs';
import { DOMParser, type Element } from '@xmldom/xmldom';
import { SvgShapeCreator } from '../../application/ports/SvgShapeCreator';
import { SvgReadResult, SvgStore } from '../../application/ports/SvgStore';
import { GroupShape } from '../../domain/GroupShape';
import { SvgDocument } from '../../domain/SvgDocument';
import { parseNumber } from '../../domain/Numbers';
import { SvgSerializer } from './SvgSerializer';

export class SvgFileStore implements SvgStore {
  constructor(private readonly factory: SvgShapeCreator,
    private readonly serializer = new SvgSerializer()) {}

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
        const attributes: Record<string, string> = {};
        for (let index = 0; index < child.attributes.length; index++) {
          const attribute = child.attributes.item(index)!;
          attributes[attribute.name] = attribute.value;
        }
        const shape = this.factory.createFromSvg(tag, id, attributes, child.textContent ?? '');
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
      writeFileSync(filePath, this.serializer.serialize(document), 'utf8');
    } catch {
      throw new Error(`cannot write file: ${filePath}`);
    }
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
