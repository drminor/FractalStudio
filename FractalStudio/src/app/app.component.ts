import { Component, OnInit, AfterViewInit } from '@angular/core';

import { IMapInfo, IPoint, Point, MapInfo, IBox, Box, ColorMap, ColorNumbers, ColorMapEntry } from './m-map/m-map-common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  mapInfo: IMapInfo;
  mapCoords: IBox;
  maxIterations: number;
  iterationsPerStep: number;

  colorMap: ColorMap;

  history: IMapInfo[] = [];


  constructor() {
    const bottomLeft: IPoint = new Point(-2, -1);
    const topRight: IPoint = new Point(1, 1);

    this.mapCoords = new Box(bottomLeft, topRight);

    this.iterationsPerStep = 10;
    this.maxIterations = 50;
    this.mapInfo = new MapInfo(this.mapCoords, this.maxIterations, this.iterationsPerStep);

    this.colorMap = this.buildColorMap();
  }

  onMapInfoUpdated(mapInfo: IMapInfo) {
    console.log('Received the updated mapinfo from Param Form ' + mapInfo.bottomLeft.x + '.');
    this.history.push(this.mapInfo);
    this.mapInfo = mapInfo;

    this.mapCoords = mapInfo.coords;
    this.maxIterations = mapInfo.maxInterations;
    this.iterationsPerStep = mapInfo.iterationsPerStep;
  }

  onZoomed(mapCoords: IBox) {
    console.log('Received the updated mapinfo from zoom ' + mapCoords.start.x + '.');
    this.history.push(this.mapInfo);
    this.mapInfo = new MapInfo(mapCoords, this.mapInfo.maxInterations, this.mapInfo.iterationsPerStep);

    this.mapCoords = mapCoords;
  }

  // Handles Back and Reset operations.
  onGoBack(steps: number) {
    if (steps === -1) {
      if (this.history.length > 0) {
        this.mapInfo = this.history[0];
        this.history = [];
      }
    }
    else if (steps === 1) {
      if (this.history.length > 0) {
        this.mapInfo = this.history.pop();
      }
    }
    else if (steps == 2) {
      this.doTest();
    }
    else {
      throw new RangeError('Steps must be 1 or -1.');
    }
    this.mapCoords = this.mapInfo.coords;
    this.maxIterations = this.mapInfo.maxInterations;
    this.iterationsPerStep = this.mapInfo.iterationsPerStep;
  }

  private doTest(): void {
    let cNumGenerator = new ColorNumbers();

    let cMap = this.buildColorMap();
    let cMapEntry = new ColorMapEntry(15, cNumGenerator.getColorNumber(30, 40, 60));

    cMap.insertColorMapEntry(cMapEntry, 1);
    this.colorMap = cMap;
  }

  private buildColorMap(): ColorMap {

    let cNumGenerator = new ColorNumbers();

    let ranges: ColorMapEntry[] = new Array<ColorMapEntry>(4);
    ranges[0] = new ColorMapEntry(10, cNumGenerator.white);
    ranges[1] = new ColorMapEntry(20, cNumGenerator.red);
    ranges[2] = new ColorMapEntry(50, cNumGenerator.green);
    ranges[3] = new ColorMapEntry(200, cNumGenerator.blue);
    ranges[4] = new ColorMapEntry(500, cNumGenerator.getColorNumber(100, 200, 50));
    ranges[5] = new ColorMapEntry(800, cNumGenerator.getColorNumber(50, 240, 10));
    ranges[6] = new ColorMapEntry(1200, cNumGenerator.getColorNumber(245, 0, 80));

    let result: ColorMap = new ColorMap(ranges, cNumGenerator.black);
    return result;
  }

}
