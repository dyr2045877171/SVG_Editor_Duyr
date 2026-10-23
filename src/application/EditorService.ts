import { SvgDocument } from '../domain/SvgDocument';
import { numberText } from '../domain/Numbers';
import { SvgStore } from './ports/SvgStore';
import { EditCommand } from './commands/EditCommand';
import { History } from './History';

export class EditorService {
  private document: SvgDocument | null = null;
  private filePath: string | null = null;
  private readonly history = new History();

  constructor(private readonly store: SvgStore) {}

  init(width = 800, height = 600): string {
    const document = new SvgDocument(width, height);
    this.document = document;
    this.filePath = null;
    this.history.blockAfterIo();
    return `canvas ${numberText(width)}x${numberText(height)} created`;
  }

  read(filePath: string): string[] {
    const result = this.store.read(filePath);
    this.document = result.document;
    this.filePath = filePath;
    this.history.blockAfterIo();
    return [...result.warnings, `read ${filePath} (${result.document.allShapes().length} elements)`];
  }

  save(filePath?: string): string {
    const document = this.requireDocument();
    const target = filePath ?? this.filePath;
    if (!target) throw new Error('no save path. use save <file.svg>');
    this.store.write(target, document);
    this.filePath = target;
    this.history.blockAfterIo();
    return `saved to ${target} (${document.allShapes().length} elements)`;
  }

  canvas(width?: number, height?: number): string {
    const document = this.requireDocument();
    if (width === undefined && height === undefined) {
      return `canvas ${numberText(document.width)}x${numberText(document.height)}`;
    }
    if (width === undefined || height === undefined) throw new Error('canvas requires width and height');
    document.resize(width, height);
    this.history.blockAfterIo();
    return `canvas resized to ${numberText(width)}x${numberText(height)}`;
  }

  execute(command: EditCommand): string {
    const before = this.requireDocument();
    const after = before.clone();
    const feedback = command.execute(after);
    this.document = after;
    this.history.record(command, before, after, feedback);
    return feedback;
  }

  undo(): string {
    this.requireDocument();
    const result = this.history.undo();
    this.document = result.document;
    return result.message;
  }

  redo(): string {
    this.requireDocument();
    const result = this.history.redo();
    this.document = result.document;
    return result.message;
  }

  tree(id?: string): string { return this.requireDocument().tree(id); }
  show(id: string): string { return this.requireDocument().show(id); }
  snapshot(): SvgDocument { return this.requireDocument().clone(); }

  private requireDocument(): SvgDocument {
    if (!this.document) throw new Error("no document. use 'init' or 'read' first");
    return this.document;
  }
}

