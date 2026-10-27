import { SvgDocument } from '../domain/SvgDocument';
import { EditCommand } from './commands/EditCommand';

interface HistoryEntry {
  command: EditCommand;
  before: SvgDocument;
  after: SvgDocument;
  feedback: string;
}

export class History {
  private readonly undoStack: HistoryEntry[] = [];
  private readonly redoStack: HistoryEntry[] = [];
  private ioBarrier = false;

  record(command: EditCommand, before: SvgDocument, after: SvgDocument, feedback: string): void {
    this.undoStack.push({ command, before, after, feedback });
    this.redoStack.length = 0;
    this.ioBarrier = false;
  }

  blockAfterIo(): void {
    this.undoStack.length = 0;
    this.redoStack.length = 0;
    this.ioBarrier = true;
  }

  undo(): { document: SvgDocument; message: string } {
    this.checkAllowed();
    const entry = this.undoStack.pop();
    if (!entry) throw new Error('nothing to undo');
    const document = entry.before.clone();
    this.redoStack.push(entry);
    return { document, message: entry.command.undoMessage(document, entry.feedback) };
  }

  redo(): { document: SvgDocument; message: string } {
    this.checkAllowed();
    const entry = this.redoStack.pop();
    if (!entry) throw new Error('nothing to redo');
    const document = entry.after.clone();
    this.undoStack.push(entry);
    return { document, message: entry.command.redoMessage(document, entry.feedback) };
  }

  private checkAllowed(): void {
    if (this.ioBarrier) throw new Error('undo not allowed after io command');
  }
}
