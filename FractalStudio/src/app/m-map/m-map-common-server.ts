import { IPoint, IBox, ICanvasSize, SCoords, Point, CanvasSize } from './m-map-common';
import { read } from 'fs';

//export enum JobRequestType {
//  Generate,
//  IncreaseInterations,
//  TransformCoords,
//  Delete
//}

export enum TransformType {
  In,
  Out,
  Left,
  Right,
  Up,
  Down
}

export class MapSection {
  constructor(public sectionAnchor: IPoint, public canvasSize: ICanvasSize) { }

  public static fromBox(box: IBox): MapSection {
    const result = new MapSection(new Point(box.botLeft.x, box.botLeft.y), box.size);
    return result;
  }
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

export class SMapWorkRequest {
  public connectionId: string;
  public jobId: number;

  constructor(public name: string, public coords: SCoords, public maxIterations: number, public canvasSize: ICanvasSize) {
    this.connectionId = null;
    this.jobId = -1;
  }
}

export class SCoordsWorkRequest {
  public jobId: number;

  constructor(public transformType: TransformType, public coords: SCoords, public canvasSize: ICanvasSize, public mapSection: MapSection) {
    this.jobId = -1;
  }

  public static clone(req: SCoordsWorkRequest): SCoordsWorkRequest {

    let result = new SCoordsWorkRequest(req.transformType, req.coords, req.canvasSize, req.mapSection);
    return result;
  }

}


