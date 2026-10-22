import { SvgDocument } from '../../domain/SvgDocument';

export abstract class EditCommand {
  abstract execute(document: SvgDocument): string;
}

