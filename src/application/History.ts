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
    this.redoStack.push(entry);
    return { document: entry.before.clone(), message: `undid: ${entry.feedback}` };
  }

  redo(): { document: SvgDocument; message: string } {
    this.checkAllowed();
    const entry = this.redoStack.pop();
    if (!entry) throw new Error('nothing to redo');
    this.undoStack.push(entry);
    return { document: entry.after.clone(), message: `redid: ${entry.feedback}` };
  }

  private checkAllowed(): void {
    if (this.ioBarrier) throw new Error('undo not allowed after io command');
  }
}

