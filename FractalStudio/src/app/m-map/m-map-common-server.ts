import { IPoint, IBox, ICanvasSize } from './m-map-common';

export class MapSection {
  constructor(public sectionAnchor: IPoint, public canvasSize: ICanvasSize) { }
}

export class MapSectionResult {
  constructor(public jobId: number, public mapSection: MapSection, public imageData: number[]) { }
}

export class MapWorkRequest {
  public connectionId: string;
  public jobId: number;

  constructor(public coords: IBox, public maxIterations: number, public canvasSize: ICanvasSize) {
    this.connectionId = null;
    this.jobId = -1;
  }
}
