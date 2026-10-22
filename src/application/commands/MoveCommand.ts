import { SvgDocument } from '../../domain/SvgDocument';
import { finite } from '../../domain/Numbers';
import { EditCommand } from './EditCommand';

export class MoveCommand extends EditCommand {
  constructor(private readonly id: string, private readonly dx: number, private readonly dy: number) { super(); }
  execute(document: SvgDocument): string {
    finite(this.dx, 'dx'); finite(this.dy, 'dy');
    const shape = document.requireShape(this.id);
    shape.move(this.dx, this.dy);
    return `${shape.type}#${shape.id} moved by (${this.dx},${this.dy})`;
  }
}

