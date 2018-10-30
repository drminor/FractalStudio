import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';

import { IMapInfo, IPoint, Point, MapInfo, IBox, Box, ColorMap, ColorNumbers, ColorMapEntry } from './m-map/m-map-common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  @ViewChild('download') downloadRef: ElementRef;

  private _mapInfo: IMapInfo;

  get mapInfo(): IMapInfo {
    return this._mapInfo;
  }

  set mapInfo(mapInfo: IMapInfo) {
    this._mapInfo = mapInfo;
    this.mapCoords = mapInfo.coords;
    this.maxIterations = mapInfo.maxIterations;
    this.iterationsPerStep = mapInfo.iterationsPerStep;
  }

  mapCoords: IBox;
  maxIterations: number;
  iterationsPerStep: number;

  colorMap: ColorMap;
  dataUri: string;

  history: IMapInfo[] = [];

  constructor() {
    const bottomLeft: IPoint = new Point(-2, -1);
    const topRight: IPoint = new Point(1, 1);

    this.mapCoords = new Box(bottomLeft, topRight);

    this.maxIterations = 130;
    this.iterationsPerStep = 10;
    this.mapInfo = new MapInfo(this.mapCoords, this.maxIterations, this.iterationsPerStep);

    this.colorMap = this.buildColorMap();
  }

  onColorMapUpdated(colorMap: ColorMap) {
    console.log('App Component is handling onColorMapUpdated.');
    this.colorMap = colorMap;
  }

  onHaveImageData(dataUrl: string) {
    console.log('We got the image Uri.');
    this.dataUri = dataUrl;
    this.updateDownloadLinkVisibility(true);
    //let anchorTag = this.downloadRef.nativeElement as HTMLHRElement;
    //anchorTag.click();
  }

  onMapInfoUpdated(mapInfo: IMapInfo) {
    console.log('Received the updated mapinfo from Param Form ' + mapInfo.bottomLeft.x + '.');
    this.history.push(this.mapInfo);
    this.updateDownloadLinkVisibility(false);
    this.mapInfo = mapInfo;
  }

  onZoomed(mapCoords: IBox) {
    console.log('Received the updated mapinfo from zoom ' + mapCoords.start.x + '.');
    this.history.push(this.mapInfo);
    this.updateDownloadLinkVisibility(false);
    this.mapInfo = new MapInfo(mapCoords, this.mapInfo.maxIterations, this.mapInfo.iterationsPerStep);

    //this.mapCoords = mapCoords;
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

    this.updateDownloadLinkVisibility(false);

    //this.mapCoords = this.mapInfo.coords;
    //this.maxIterations = this.mapInfo.maxInterations;
    //this.iterationsPerStep = this.mapInfo.iterationsPerStep;
  }

  private updateDownloadLinkVisibility(show: boolean): void {
    let anchorTag = this.downloadRef.nativeElement as HTMLHRElement;
    anchorTag.hidden = !show;
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

    let ranges: ColorMapEntry[] = new Array<ColorMapEntry>(13);
    ranges[0] = new ColorMapEntry(3, cNumGenerator.white);
    ranges[1] = new ColorMapEntry(5, cNumGenerator.red);
    ranges[2] = new ColorMapEntry(8, cNumGenerator.green);
    ranges[3] = new ColorMapEntry(13, cNumGenerator.blue);

    ranges[4] = new ColorMapEntry(21, cNumGenerator.red);
    ranges[5] = new ColorMapEntry(34, cNumGenerator.green);
    ranges[6] = new ColorMapEntry(55, cNumGenerator.blue);

    ranges[7] = new ColorMapEntry(79, cNumGenerator.red);
    ranges[8] = new ColorMapEntry(100, cNumGenerator.green);
    ranges[9] = new ColorMapEntry(200, cNumGenerator.blue);

    ranges[10] = new ColorMapEntry(500, cNumGenerator.getColorNumber(100, 200, 50));
    ranges[11] = new ColorMapEntry(800, cNumGenerator.getColorNumber(50, 240, 10));
    ranges[12] = new ColorMapEntry(1200, cNumGenerator.getColorNumber(245, 0, 80));

    let result: ColorMap = new ColorMap(ranges, cNumGenerator.black);
    return result;
  }

}
