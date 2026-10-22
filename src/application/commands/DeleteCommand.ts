import { SvgDocument } from '../../domain/SvgDocument';
import { EditCommand } from './EditCommand';

export class DeleteCommand extends EditCommand {
  constructor(private readonly id: string) { super(); }
  execute(document: SvgDocument): string {
    const shape = document.delete(this.id);
    return `${shape.type}#${shape.id} deleted`;
  }
}

