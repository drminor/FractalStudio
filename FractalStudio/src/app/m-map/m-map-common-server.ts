import { ColorNumbers } from './ColorNumbers';

import { IPoint, IBox, IMapInfo, MapInfo, ICanvasSize, ColorMapEntry, ColorMapEntryBlendStyle, ColorMap } from './m-map-common';

export class MapSection {
  constructor(public sectionAnchor: IPoint, public canvasSize: ICanvasSize) { }
}

export class MapWorkRequest {
  constructor(public connectionId: string, public coords: IBox, public maxIterations: number, public canvasSize: ICanvasSize) { }

}
