import { GroupShape } from '../../domain/GroupShape';
import { Shape } from '../../domain/Shape';
import { SvgDocument } from '../../domain/SvgDocument';
import { TextShape } from '../../domain/TextShape';
import { numberText } from '../../domain/Numbers';

export class SvgSerializer {
  serialize(document: SvgDocument): string {
    const width = numberText(document.width);
    const height = numberText(document.height);
    const children = document.root.children.map(child => this.shapeXml(child, 1)).join('\n');
    return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${children ? `\n${children}\n` : '\n'}</svg>\n`;
  }

  private shapeXml(shape: Shape, depth: number): string {
    const attributes = [['id', shape.id], ...shape.attributes()]
      .map(([name, value]) => ` ${name}="${this.escape(value)}"`).join('');
    const open = `${'  '.repeat(depth)}<${shape.type}${attributes}`;
    if (shape instanceof GroupShape) {
      if (shape.children.length === 0) return `${open}/>`;
      const children = shape.children.map(child => this.shapeXml(child, depth + 1)).join('\n');
      return `${open}>\n${children}\n${'  '.repeat(depth)}</g>`;
    }
    if (shape instanceof TextShape) {
      return `${open}>${this.escape(shape.textContent)}</text>`;
    }
    return `${open}/>`;
  }

  private escape(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  }
}
