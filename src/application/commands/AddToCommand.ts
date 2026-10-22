import { SvgDocument } from '../../domain/SvgDocument';
import { EditCommand } from './EditCommand';

export class AddToCommand extends EditCommand {
  constructor(private readonly containerId: string, private readonly id: string) { super(); }
  execute(document: SvgDocument): string {
    const shape = document.requireShape(this.id);
    document.addTo(this.containerId, this.id);
    return `${shape.type}#${shape.id} added to g#${this.containerId}`;
  }
}

