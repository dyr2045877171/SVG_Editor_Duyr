import { SvgDocument } from '../../domain/SvgDocument';
import { EditCommand } from './EditCommand';

export class BackCommand extends EditCommand {
  constructor(private readonly id: string) { super(); }
  execute(document: SvgDocument): string {
    const shape = document.requireShape(this.id);
    document.back(this.id);
    return `${shape.type}#${shape.id} moved to back`;
  }
}

