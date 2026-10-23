import { EditorService } from '../application/EditorService';
import { CreateCommand } from '../application/commands/CreateCommand';
import { DeleteCommand } from '../application/commands/DeleteCommand';
import { MoveCommand } from '../application/commands/MoveCommand';
import { ScaleCommand } from '../application/commands/ScaleCommand';
import { SetCommand } from '../application/commands/SetCommand';
import { GroupCommand } from '../application/commands/GroupCommand';
import { UngroupCommand } from '../application/commands/UngroupCommand';
import { AddToCommand } from '../application/commands/AddToCommand';
import { FrontCommand } from '../application/commands/FrontCommand';
import { BackCommand } from '../application/commands/BackCommand';
import { parseNumber } from '../domain/Numbers';
import { Tokenizer } from './Tokenizer';

export class CommandDispatcher {
  constructor(private readonly editor: EditorService, private readonly tokenizer = new Tokenizer()) {}

  run(line: string): string {
    try {
      const tokens = this.tokenizer.parse(line);
      if (tokens.length === 0) return '';
      const [name, ...args] = tokens;
      switch (name) {
        case 'init':
          this.arity(name, args, 0, 2);
          return this.editor.init(args[0] === undefined ? 800 : parseNumber(args[0], 'width'),
            args[1] === undefined ? 600 : parseNumber(args[1], 'height'));
        case 'read':
          this.arity(name, args, 1);
          return this.editor.read(args[0]!).join('\n');
        case 'save':
          this.arity(name, args, 0, 1);
          return this.editor.save(args[0]);
        case 'canvas':
          this.arity(name, args, 0, 2);
          if (args.length === 1) throw new Error('canvas requires width and height');
          return this.editor.canvas(args[0] === undefined ? undefined : parseNumber(args[0], 'width'),
            args[1] === undefined ? undefined : parseNumber(args[1], 'height'));
        case 'create': {
          if (args.length < 2) throw new Error('invalid create arguments');
          const [type, id, ...rest] = args;
          let containerId: string | undefined;
          if (rest.length >= 2 && rest[rest.length - 2] === 'in') {
            containerId = rest.pop();
            rest.pop();
          }
          return this.editor.execute(new CreateCommand(type!, id!, rest, containerId));
        }
        case 'delete':
          this.arity(name, args, 1);
          return this.editor.execute(new DeleteCommand(args[0]!));
        case 'move':
          this.arity(name, args, 3);
          return this.editor.execute(new MoveCommand(args[0]!, parseNumber(args[1]!, 'dx'), parseNumber(args[2]!, 'dy')));
        case 'scale':
          this.arity(name, args, 2);
          return this.editor.execute(new ScaleCommand(args[0]!, parseNumber(args[1]!, 'factor')));
        case 'set':
          this.arity(name, args, 3);
          return this.editor.execute(new SetCommand(args[0]!, args[1]!, args[2]!));
        case 'group':
          if (args.length < 2) throw new Error('group requires an id and at least one shape');
          return this.editor.execute(new GroupCommand(args[0]!, args.slice(1)));
        case 'ungroup':
          this.arity(name, args, 1);
          return this.editor.execute(new UngroupCommand(args[0]!));
        case 'addto':
          this.arity(name, args, 2);
          return this.editor.execute(new AddToCommand(args[0]!, args[1]!));
        case 'front':
          this.arity(name, args, 1);
          return this.editor.execute(new FrontCommand(args[0]!));
        case 'back':
          this.arity(name, args, 1);
          return this.editor.execute(new BackCommand(args[0]!));
        case 'undo':
          this.arity(name, args, 0);
          return this.editor.undo();
        case 'redo':
          this.arity(name, args, 0);
          return this.editor.redo();
        case 'tree':
          this.arity(name, args, 0, 1);
          return this.editor.tree(args[0]);
        case 'show':
          this.arity(name, args, 1);
          return this.editor.show(args[0]!);
        case 'help':
          this.arity(name, args, 0);
          return 'init [w] [h] | read <file.svg> | save [file.svg] | canvas [w] [h]\n' +
            'create <type> <id> [params] [in <containerId>] | delete <id> | move <id> <dx> <dy> | scale <id> <factor>\n' +
            'set <id> <attr> <value> | group <newGid> <id...> | ungroup <gid> | addto <gid> <id>\n' +
            'front <id> | back <id> | tree [id] | show <id> | undo | redo | help';
        default:
          throw new Error(`unknown command: ${name}`);
      }
    } catch (error) {
      return `error: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  private arity(name: string, args: string[], minimum: number, maximum = minimum): void {
    if (args.length < minimum || args.length > maximum) throw new Error(`invalid ${name} arguments`);
  }
}
