import { SvgDocument } from '../../domain/SvgDocument';

export interface SvgReadResult {
  document: SvgDocument;
  warnings: string[];
}

export interface SvgStore {
  read(filePath: string): SvgReadResult;
  write(filePath: string, document: SvgDocument): void;
}

