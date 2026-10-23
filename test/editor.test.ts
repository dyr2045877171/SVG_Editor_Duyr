import { strict as assert } from 'node:assert';
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { EditorService } from '../src/application/EditorService';
import { CommandDispatcher } from '../src/cli/CommandDispatcher';
import { SvgFileStore } from '../src/infrastructure/svg/SvgFileStore';

function setup(): CommandDispatcher {
  return new CommandDispatcher(new EditorService(new SvgFileStore()));
}

test('six shapes, nesting, editing, and SVG round trip', () => {
  const cli = setup();
  assert.equal(cli.run('init 400 200'), 'canvas 400x200 created');
  for (const line of [
    'create g flow',
    'create rect r 10 20 40 30 #aaa in flow',
    'create circle c 80 40 10 red in flow',
    'create ellipse e 100 50 5 8 in flow',
    'create line l 1 2 3 4 black in flow',
    'create text t 12 15 "hello & world" in flow'
  ]) assert.doesNotMatch(cli.run(line), /^error:/);
  assert.match(cli.run('tree'), /g#flow/);
  assert.match(cli.run('tree'), /text#t/);
  assert.doesNotMatch(cli.run('move flow 5 10'), /^error:/);
  assert.match(cli.run('show r'), /x=15 y=30/);
  assert.doesNotMatch(cli.run('scale flow 2'), /^error:/);
  assert.match(cli.run('show r'), /x=30 y=60 w=80 h=60/);
  assert.doesNotMatch(cli.run('set t text "A < B"'), /^error:/);
  const parentDir = join(__dirname, '../test-output');
  mkdirSync(parentDir, { recursive: true });
  const dir = mkdtempSync(join(parentDir, 'svg-cli-test-'));
  const file = join(dir, 'scene.svg');
  assert.doesNotMatch(cli.run(`save "${file}"`), /^error:/);
  assert.match(readFileSync(file, 'utf8'), /A &lt; B/);
  const next = setup();
  assert.doesNotMatch(next.run(`read "${file}"`), /^error:/);
  assert.match(next.run('tree'), /rect#r x=30 y=60/);
  assert.match(next.run('show t'), /A < B/);
});

test('hierarchy, z order, and failures keep state', () => {
  const cli = setup();
  cli.run('init');
  cli.run('create g outer');
  cli.run('create g inner in outer');
  cli.run('create rect a 0 0 10 10 in inner');
  cli.run('create rect b 0 0 10 10 in outer');
  cli.run('create rect c 0 0 10 10 in outer');
  assert.doesNotMatch(cli.run('front b'), /^error:/);
  assert.ok(cli.run('tree outer').indexOf('rect#c') < cli.run('tree outer').indexOf('rect#b'));
  assert.doesNotMatch(cli.run('back b'), /^error:/);
  assert.ok(cli.run('tree outer').indexOf('rect#b') < cli.run('tree outer').indexOf('g#inner'));
  assert.match(cli.run('addto inner outer'), /^error:/);
  const before = cli.run('tree');
  assert.match(cli.run('group bad inner a'), /^error:/);
  assert.equal(cli.run('tree'), before);
  assert.match(cli.run('scale outer 0'), /^error:/);
  assert.equal(cli.run('tree'), before);
  assert.doesNotMatch(cli.run('group pair b c'), /^error:/);
  assert.doesNotMatch(cli.run('ungroup pair'), /^error:/);
  assert.match(cli.run('tree outer'), /rect#b[\s\S]*rect#c/);
  assert.doesNotMatch(cli.run('delete inner'), /^error:/);
  assert.doesNotMatch(cli.run('addto outer b'), /^error:/);
});

test('external SVG assigns ids without collision and warns', () => {
  const parentDir = join(__dirname, '../test-output');
  mkdirSync(parentDir, { recursive: true });
  const dir = mkdtempSync(join(parentDir, 'svg-cli-test-'));
  const file = join(dir, 'external.svg');
  writeFileSync(file, '<svg width="100" height="60"><rect x="0" y="0" width="10" height="10"/><circle id="rect1" cx="1" cy="2" r="3"/></svg>');
  const cli = setup();
  assert.match(cli.run(`read "${file}"`), /warning: assigned id rect2 to unnamed <rect>/);
  assert.match(cli.run('tree'), /rect#rect2/);
  assert.match(cli.run('create circle rect1 2 2 2'), /^error: id already exists/);
});


test('undo and redo treat a compound edit as one unit', () => {
  const cli = setup();
  cli.run('init 300 200');
  cli.run('create g outer');
  cli.run('create rect a 1 2 10 20 in outer');
  cli.run('create rect b 20 2 10 20 in outer');

  assert.match(cli.run('group pair a b'), /2 children/);
  assert.match(cli.run('tree outer'), /g#pair/);
  assert.match(cli.run('undo'), /^undid:/);
  assert.doesNotMatch(cli.run('tree outer'), /g#pair/);
  assert.match(cli.run('tree outer'), /rect#a[\s\S]*rect#b/);
  assert.match(cli.run('redo'), /^redid:/);
  assert.match(cli.run('tree outer'), /g#pair/);

  cli.run('move pair 5 6');
  assert.match(cli.run('show a'), /x=6 y=8/);
  cli.run('undo');
  assert.match(cli.run('show a'), /x=1 y=2/);
  cli.run('redo');
  assert.match(cli.run('show a'), /x=6 y=8/);

  cli.run('delete pair');
  assert.match(cli.run('show a'), /^error: no such shape/);
  cli.run('undo');
  assert.match(cli.run('tree outer'), /g#pair[\s\S]*rect#a[\s\S]*rect#b/);
});

test('queries and failed edits do not consume history; new edit clears redo', () => {
  const cli = setup();
  assert.match(cli.run('undo'), /^error: no document/);
  cli.run('init');
  cli.run('create rect r 1 2 10 20');
  cli.run('move r 3 4');
  const moved = cli.run('tree');
  assert.match(cli.run('scale r 0'), /^error: scale factor must be positive/);
  assert.equal(cli.run('tree'), moved);
  assert.match(cli.run('show r'), /x=4 y=6/);
  assert.match(cli.run('help'), /undo \| redo/);
  assert.equal(cli.run('# replay comment'), '');
  assert.match(cli.run('undo'), /^undid:/);
  assert.match(cli.run('show r'), /x=1 y=2/);
  assert.match(cli.run('set r unknown 4'), /^error: unknown attribute/);
  assert.match(cli.run('redo'), /^redid:/);
  cli.run('undo');
  cli.run('set r fill blue');
  assert.match(cli.run('redo'), /^error: nothing to redo/);
  assert.match(cli.run('tree'), /fill=blue/);
});

test('successful document operations block history until the next edit', () => {
  const cli = setup();
  assert.match(cli.run('init'), /created/);
  assert.equal(cli.run('undo'), 'error: undo not allowed after io command');
  cli.run('create rect r 0 0 10 10');
  cli.run('canvas');
  assert.match(cli.run('undo'), /^undid:/);
  cli.run('redo');

  const parentDir = join(__dirname, '../test-output');
  mkdirSync(parentDir, { recursive: true });
  const dir = mkdtempSync(join(parentDir, 'svg-cli-history-'));
  const file = join(dir, 'scene.svg');
  assert.doesNotMatch(cli.run(`save "${file}"`), /^error:/);
  assert.equal(cli.run('undo'), 'error: undo not allowed after io command');
  assert.equal(cli.run('redo'), 'error: undo not allowed after io command');
  cli.run('create circle c 20 20 5');
  cli.run('undo');
  assert.match(cli.run('show c'), /^error: no such shape/);
  assert.match(cli.run('show r'), /rect#r/);
  assert.match(cli.run('undo'), /^error: nothing to undo/);

  cli.run('redo');
  cli.run('canvas 500 400');
  assert.equal(cli.run('undo'), 'error: undo not allowed after io command');
  assert.equal(cli.run('canvas'), 'canvas 500x400');
  cli.run('move r 2 3');
  cli.run('undo');
  assert.match(cli.run('show r'), /x=0 y=0/);

  assert.doesNotMatch(cli.run(`read "${file}"`), /^error:/);
  assert.equal(cli.run('undo'), 'error: undo not allowed after io command');
  assert.match(cli.run('show r'), /rect#r/);
});

