import { Component, OnInit, AfterViewInit } from '@angular/core';

import { IMapInfo, IPoint, Point, MapInfo, IBox, Box } from './m-map/m-map-common';

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

  history: IMapInfo[] = [];


  constructor() {
    const bottomLeft: IPoint = new Point(-2, -1);
    const topRight: IPoint = new Point(1, 1);

    this.mapCoords = new Box(bottomLeft, topRight);

    this.iterationsPerStep = 10;
    this.maxIterations = 50;
    this.mapInfo = new MapInfo(this.mapCoords, this.maxIterations, this.iterationsPerStep);
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
    else {
      throw new RangeError('Steps must be 1 or -1.');
    }
    this.mapCoords = this.mapInfo.coords;
    this.maxIterations = this.mapInfo.maxInterations;
    this.iterationsPerStep = this.mapInfo.iterationsPerStep;
  }

}
