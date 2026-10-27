import { Shape } from '../../domain/Shape';

export interface SvgShapeCreator {
  createFromSvg(type: string, id: string,
    attributes: Readonly<Record<string, string>>, textContent: string): Shape;
}
