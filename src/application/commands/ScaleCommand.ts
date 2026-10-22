import { SvgDocument } from '../../domain/SvgDocument';
import { positive } from '../../domain/Numbers';
import { EditCommand } from './EditCommand';

export class ScaleCommand extends EditCommand {
  constructor(private readonly id: string, private readonly factor: number) { super(); }
  execute(document: SvgDocument): string {
    if (!Number.isFinite(this.factor) || this.factor <= 0) throw new Error('scale factor must be positive');
    positive(this.factor, 'scale factor');
    const shape = document.requireShape(this.id);
    shape.scale(this.factor);
    return `${shape.type}#${shape.id} scaled by ${this.factor}`;
  }
}

