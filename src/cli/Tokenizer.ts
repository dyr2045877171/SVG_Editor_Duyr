export class Tokenizer {
  parse(line: string): string[] {
    if (!line.trim() || line.trimStart().startsWith('#')) return [];
    const tokens: string[] = [];
    let current = '';
    let quoted = false;
    let started = false;
    for (let index = 0; index < line.length; index++) {
      const char = line[index]!;
      if (quoted && char === '\\' && (line[index + 1] === '"' || line[index + 1] === '\\')) {
        current += line[++index]!;
      } else if (char === '"') {
        quoted = !quoted;
        started = true;
      } else if (!quoted && /\s/.test(char)) {
        if (started) { tokens.push(current); current = ''; started = false; }
      } else {
        current += char;
        started = true;
      }
    }
    if (quoted) throw new Error('unterminated quoted string');
    if (started) tokens.push(current);
    return tokens;
  }

  number(value: string, name: string): number {
    if (value.trim() === '') throw new Error(`invalid ${name}: expected number`);
    const number = Number(value);
    if (!Number.isFinite(number)) throw new Error(`invalid ${name}: must be finite`);
    return number;
  }
}
