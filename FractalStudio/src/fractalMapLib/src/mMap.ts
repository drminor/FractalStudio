export class MMap {


}


export interface IPoint {
  x: number;
  y: number;
}

export interface IMapInfo {
  topLeft: IPoint;
  bottomRight: IPoint;
  maxInterations: number;
}

export class Point implements IPoint {
  constructor(public x: number, public y: number) { }
}

export class MapInfo implements IMapInfo {
  constructor(public topLeft: IPoint, public bottomRight: IPoint, public maxInterations: number) {
  }
}

