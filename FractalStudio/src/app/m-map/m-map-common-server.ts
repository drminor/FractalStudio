import { ColorNumbers } from './ColorNumbers';

import { IBox, IMapInfo, MapInfo, ICanvasSize, ColorMapEntry, ColorMapEntryBlendStyle, ColorMap } from './m-map-common';


export class MapWorkRequest {
  constructor(public connectionId: string, public coords: IBox, public maxIterations: number, public canvasSize: ICanvasSize) { }

}
