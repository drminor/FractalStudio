import { Injectable } from '@angular/core';

import { IPoint, Point, ICanvasSize, CanvasSize, IMapInfo, MapInfo, IMapWorkingData, MapWorkingData } from '../mMapCommon/m-map-common';

@Injectable({
  providedIn: 'root'
})
export class MMapService {

  constructor() { }

  public createTestMapWD(): IMapWorkingData {

    var maxInterations = 1000;
    var cs: ICanvasSize = new CanvasSize(100, 100);

    var bottomLeft: IPoint = new Point(-2, -1);
    var topRight: IPoint = new Point(1, 1);

    var mi: IMapInfo = new MapInfo(bottomLeft, topRight, maxInterations);

    { debugger }
    var result: IMapWorkingData = new MapWorkingData(cs, mi);

    var alive = result.doInterations(10);

    var flags: boolean[] = MapWorkingData.getFlagData(result);

    const fIndex:number = flags.findIndex(t => t === false);
    { debugger }

    //alive = false;

    //for (var flag:boolean in flags) {
    //  if (!flag) {
    //    alive = true;
    //    break;
    //  }
    //}

    console.log("The flags has " + flags.length + " elements.");

    if (alive) {
      console.log("There is at least one point that is in the set.");
    }
    else {
      console.log("There are no points in the set.");
    }


    return result;
  }

  public performInterations(numIterations: number, workingData: IMapWorkingData): boolean {
    return false;
  }
}
