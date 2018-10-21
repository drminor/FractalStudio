import { Injectable } from '@angular/core';

import {
  IPoint, Point, ICanvasSize, CanvasSize,
  IMapInfo, MapInfo, IMapWorkingData, MapWorkingData
} from './m-map-common';

@Injectable({
  providedIn: 'root'
})
export class MMapService {

  constructor() { }

  public createMapWD(canvasSize: ICanvasSize, mapInfo: IMapInfo): IMapWorkingData {
    const result: IMapWorkingData = new MapWorkingData(canvasSize, mapInfo, new Point(0,0));
    return result;
  }

  public createTestMapWD(): IMapWorkingData {

    const maxInterations = 1000;
    const cs: ICanvasSize = new CanvasSize(100, 100);

    const bottomLeft: IPoint = new Point(-2, -1);
    const topRight: IPoint = new Point(1, 1);

    const mi: IMapInfo = new MapInfo(bottomLeft, topRight, maxInterations);

    const result: IMapWorkingData = new MapWorkingData(cs, mi, new Point(0,0));
    return result;

    
    //var alive = result.doInterations(10);

    //var flags: boolean[] = MapWorkingData.getFlagData(result);

    //const fIndex:number = flags.findIndex(t => t === false);
    //{ debugger }

    ////alive = false;

    ////for (var flag:boolean in flags) {
    ////  if (!flag) {
    ////    alive = true;
    ////    break;
    ////  }
    ////}

    //console.log("The flags has " + flags.length + " elements.");

    //if (alive) {
    //  console.log("There is at least one point that is in the set.");
    //}
    //else {
    //  console.log("There are no points in the set.");
    //}
    //return result;
  }

}
