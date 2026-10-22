import * as readline from 'node:readline';
import { EditorService } from './application/EditorService';
import { CommandDispatcher } from './cli/CommandDispatcher';
import { SvgFileStore } from './infrastructure/svg/SvgFileStore';

const dispatcher = new CommandDispatcher(new EditorService(new SvgFileStore()));
const repl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: 'svg> ' });

process.stdout.write("svg-editor 0.1 — type 'help' for commands\n");
repl.prompt();
repl.on('line', line => {
  const result = dispatcher.run(line);
  if (result) process.stdout.write(result + '\n');
  repl.prompt();
});

