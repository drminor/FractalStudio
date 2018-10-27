import { Component, OnInit, AfterViewInit } from '@angular/core';

import { IMapInfo, IPoint, Point, MapInfo, IBox, Box } from './m-map/m-map-common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  private mapInfo: IMapInfo;

  history: IMapInfo[] = [];


  constructor() {
    const bottomLeft: IPoint = new Point(-2, -1);
    const topRight: IPoint = new Point(1, 1);

    const coords: IBox = new Box(bottomLeft, topRight);

    const iterationsPerStep = 10;
    const maxInterations = 500;
    this.mapInfo = new MapInfo(coords, maxInterations, iterationsPerStep);
  }

  onMapInfoUpdated(mapInfo: IMapInfo) {
    console.log('Received the updated mapinfo from Param Form ' + mapInfo.bottomLeft.x + '.');
    this.history.push(this.mapInfo);
    this.mapInfo = mapInfo;
  }

  onZoomed(mapInfo: IMapInfo) {
    console.log('Received the updated mapinfo from zoom ' + mapInfo.bottomLeft.x + '.');
    this.history.push(this.mapInfo);
    this.mapInfo = mapInfo;
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
  }

}
