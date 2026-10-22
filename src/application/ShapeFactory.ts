import { Shape } from '../domain/Shape';
import { RectShape } from '../domain/RectShape';
import { CircleShape } from '../domain/CircleShape';
import { EllipseShape } from '../domain/EllipseShape';
import { LineShape } from '../domain/LineShape';
import { TextShape } from '../domain/TextShape';
import { GroupShape } from '../domain/GroupShape';
import { parseNumber } from '../domain/Numbers';

export class ShapeFactory {
  create(type: string, id: string, args: string[]): Shape {
    let shape: Shape;
    let expected = 0;
    let optionalStyle: string | undefined;
    switch (type) {
      case 'rect':
        expected = 4; this.checkCount(type, args, expected, true);
        shape = new RectShape(id, ...this.numbers(args.slice(0, 4), ['x', 'y', 'width', 'height']) as [number, number, number, number]);
        optionalStyle = 'fill'; break;
      case 'circle':
        expected = 3; this.checkCount(type, args, expected, true);
        shape = new CircleShape(id, ...this.numbers(args.slice(0, 3), ['cx', 'cy', 'r']) as [number, number, number]);
        optionalStyle = 'fill'; break;
      case 'ellipse':
        expected = 4; this.checkCount(type, args, expected, true);
        shape = new EllipseShape(id, ...this.numbers(args.slice(0, 4), ['cx', 'cy', 'rx', 'ry']) as [number, number, number, number]);
        optionalStyle = 'fill'; break;
      case 'line':
        expected = 4; this.checkCount(type, args, expected, true);
        shape = new LineShape(id, ...this.numbers(args.slice(0, 4), ['x1', 'y1', 'x2', 'y2']) as [number, number, number, number]);
        optionalStyle = 'stroke'; break;
      case 'text':
        expected = 3; this.checkCount(type, args, expected, false);
        shape = new TextShape(id, parseNumber(args[0]!, 'x'), parseNumber(args[1]!, 'y'), args[2]!);
        break;
      case 'g':
        this.checkCount(type, args, 0, false);
        shape = new GroupShape(id); break;
      default:
        throw new Error(`unknown shape type: ${type} (is the plugin loaded?)`);
    }
    if (optionalStyle && args.length > expected) shape.setAttribute(optionalStyle, args[expected]!);
    return shape;
  }

  private numbers(values: string[], names: string[]): number[] {
    return values.map((value, index) => parseNumber(value, names[index]!));
  }

  private checkCount(type: string, args: string[], required: number, optional: boolean): void {
    if (args.length < required || args.length > required + (optional ? 1 : 0)) {
      throw new Error(`invalid create ${type} arguments`);
    }
  }
}


