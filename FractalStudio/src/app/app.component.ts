import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Logger } from './logger.service';

import { IMapInfo, IPoint, Point, MapInfo } from './m-map/m-map-common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit, OnInit {

  public mapInfo: IMapInfo;

  private viewInitialized: boolean;

  constructor(private logger: Logger) {

    this.viewInitialized = false;

    const bottomLeft: IPoint = new Point(-2, -1);
    const topRight: IPoint = new Point(1, 1);

    const iterationsPerStep = 10;

    const maxInterations = 500;
    this.mapInfo = new MapInfo(bottomLeft, topRight, maxInterations, iterationsPerStep);
  }

  onMapInfoUpdated(mapInfo: IMapInfo) {
    console.log('Received the updated mapinfo ' + mapInfo.bottomLeft.x + '.');
    this.mapInfo = mapInfo;
  }

  ngOnInit(): void {
    console.log("We are inited.");
  }

  ngOnChanges() {
    if (!this.viewInitialized) return;
  }

  ngAfterViewInit() {
    if (!this.viewInitialized) {
      this.viewInitialized = true;
      console.log("About to draw from AfterViewInit.");
    }
  }

}
