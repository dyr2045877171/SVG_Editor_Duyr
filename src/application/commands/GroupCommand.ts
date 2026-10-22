import { SvgDocument } from '../../domain/SvgDocument';
import { EditCommand } from './EditCommand';

export class GroupCommand extends EditCommand {
  constructor(private readonly id: string, private readonly childIds: string[]) { super(); }
  execute(document: SvgDocument): string {
    const group = document.group(this.id, this.childIds);
    return `g#${group.id} created with ${group.children.length} children`;
  }
}

