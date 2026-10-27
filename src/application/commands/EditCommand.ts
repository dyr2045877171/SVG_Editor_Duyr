import { SvgDocument } from '../../domain/SvgDocument';

export abstract class EditCommand {
  abstract execute(document: SvgDocument): string;

  undoMessage(_document: SvgDocument, _feedback: string): string {
    return 'undid: previous document state restored';
  }

  redoMessage(_document: SvgDocument, feedback: string): string {
    return `redid: ${feedback}`;
  }
}
