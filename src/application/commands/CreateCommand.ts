import { SvgDocument } from '../../domain/SvgDocument';
import { ShapeFactory } from '../ShapeFactory';
import { EditCommand } from './EditCommand';

export class CreateCommand extends EditCommand {
  constructor(private readonly type: string, private readonly id: string,
    private readonly args: string[], private readonly containerId?: string,
    private readonly factory = new ShapeFactory()) { super(); }

  execute(document: SvgDocument): string {
    const shape = this.factory.create(this.type, this.id, this.args);
    document.add(shape, this.containerId);
    return `${shape.type}#${shape.id} created${this.containerId ? ` in g#${this.containerId}` : ''}`;
  }
}

