import { SvgDocument } from '../../domain/SvgDocument';
import { EditCommand } from './EditCommand';

export class UngroupCommand extends EditCommand {
  constructor(private readonly id: string) { super(); }
  execute(document: SvgDocument): string {
    document.ungroup(this.id);
    return `g#${this.id} ungrouped`;
  }
}

