import { SvgDocument } from '../../domain/SvgDocument';
import { EditCommand } from './EditCommand';

export class SetCommand extends EditCommand {
  constructor(private readonly id: string, private readonly attribute: string,
    private readonly value: string) { super(); }
  execute(document: SvgDocument): string {
    const shape = document.requireShape(this.id);
    shape.setAttribute(this.attribute, this.value);
    return `${shape.type}#${shape.id} updated: ${this.attribute}=${this.value}`;
  }
}

