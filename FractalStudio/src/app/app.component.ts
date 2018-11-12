import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';

import { IMapInfo, IPoint, Point, MapInfo, IBox, Box, ColorMap, ColorNumbers, ColorMapEntry, ColorMapUIEntry, ColorMapUI, IColorMap, MapInfoWithColorMap } from './m-map/m-map-common';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  public mapDisplayWidth: string;
  public mapDisplayHeight: string;

  public colorEditorOffSet: string;
  public colorEditorWidth: string;

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

  colorMap: IColorMap;
  //dataUri: string;

  history: IMapInfo[] = [];
  atHome: boolean;

  constructor() {
    //const bottomLeft: IPoint = new Point(-2.4, -1.2);
    //const topRight: IPoint = new Point(1, 1.2);

    //this.mapCoords = new Box(bottomLeft, topRight);

    //this.maxIterations = 130;
    //this.iterationsPerStep = 10;
    //this.mapInfo = new MapInfo(this.mapCoords, this.maxIterations, this.iterationsPerStep);

    this.mapInfo = this.buildMapInfo();
    this.colorMap = this.buildColorMap();

    this.atHome = true;

    this.mapDisplayWidth = '939px';
    this.mapDisplayHeight = '626px';

    this.colorEditorOffSet = '946px'; // 7 pixels to accomodate border, margin and 1 pixel gap.
    this.colorEditorWidth = '210px';
  }

  onColorMapUpdated(colorMap: IColorMap) {
    console.log('App Component is handling onColorMapUpdated.');
    this.colorMap = colorMap;
  }

  onHaveImageData(imageBlob: Blob) {
    console.log('We got the image Uri.');
    alert('Image Data has been created. The download size is ' + imageBlob.size + '.');

    let anchorTag = this.downloadRef.nativeElement as HTMLAnchorElement;

    let strData = window.URL.createObjectURL(imageBlob);

    anchorTag.href = strData;

    this.updateDownloadLinkVisibility(true);

    //anchorTag.click();
  }

  onMapInfoUpdated(mapInfo: IMapInfo) {
    console.log('Received the updated mapinfo from Param Form ' + mapInfo.bottomLeft.x + '.');
    this.history.push(this.mapInfo);
    this.updateDownloadLinkVisibility(false);
    this.mapInfo = mapInfo;
    this.atHome = false;
  }

  onMapInfoLoaded(miwcm: MapInfoWithColorMap) {
    // Clear History.
    this.history = [];
    this.updateDownloadLinkVisibility(false);

    //// Create a new MapInfo from the loaded data.
    //this.mapInfo = MapInfo.fromIMapInfo(miwcm.mapInfo);

    //// Create a new ColorMapUI from the loaded data.
    //this.colorMap = ColorMapUI.FromColorMapForExport(miwcm.colorMap);

    this.mapInfo = miwcm.mapInfo;
    this.colorMap = miwcm.colorMapUi;

    this.atHome = false;
  }

  onZoomed(mapCoords: IBox) {
    console.log('Received the updated mapinfo from zoom ' + mapCoords.start.x + '.');
    this.history.push(this.mapInfo);
    this.updateDownloadLinkVisibility(false);
    this.mapInfo = new MapInfo(mapCoords, this.mapInfo.maxIterations, this.mapInfo.iterationsPerStep);
    this.atHome = false;
  }

  // Handles Back and Reset operations.
  onGoBack(steps: number) {
    if (steps === -1) {
      // Reset
      //if (this.history.length > 0) {
      //  this.mapInfo = this.history[0];
      //  this.history = [];
      //}
      //else {
      //  this.mapInfo = this.buildMapInfo();
      //}
      if (!this.atHome) {
        this.history = [];
        this.mapInfo = this.buildMapInfo();
        this.atHome = true;
      }
    }
    else if (steps === 1) {
      // Go Back 1 step
      if (this.history.length > 0) {
        this.mapInfo = this.history.pop();
      }
    }
    else if (steps === 2) {
      // Just for testing
      this.doTest();
    }
    else {
      throw new RangeError('Steps must be 1 or -1.');
    }

    this.updateDownloadLinkVisibility(false);
  }

  private updateDownloadLinkVisibility(show: boolean): void {
    let anchorTag = this.downloadRef.nativeElement as HTMLAnchorElement;
    anchorTag.hidden = !show;
  }

  private doTest(): void {
    let cMap = this.buildColorMap();
    let cMapEntry = new ColorMapEntry(15, ColorNumbers.getColor(30, 40, 60));

    cMap.insertColorMapEntry(cMapEntry, 1);
    this.colorMap = cMap;
  }

  private buildMapInfo(): IMapInfo {
    const bottomLeft: IPoint = new Point(-2.4, -1.2);
    const topRight: IPoint = new Point(1, 1.2);

    let mapCoords = new Box(bottomLeft, topRight);

    let maxIterations = 100;
    let iterationsPerStep = 10;
    let result = new MapInfo(mapCoords, maxIterations, iterationsPerStep);

    return result;
  }

  private buildColorMap(): ColorMapUI {

    let cNumGenerator = new ColorNumbers();

    let ranges: ColorMapUIEntry[] = new Array<ColorMapUIEntry>(7);
    ranges[0] =  ColorMapUIEntry.fromOffsetAndColorNum(3, cNumGenerator.white);
    ranges[1] = ColorMapUIEntry.fromOffsetAndColorNum(5, cNumGenerator.red);
    ranges[2] = ColorMapUIEntry.fromOffsetAndColorNum(8, cNumGenerator.green);
    ranges[3] = ColorMapUIEntry.fromOffsetAndColorNum(13, cNumGenerator.blue);

    ranges[4] = ColorMapUIEntry.fromOffsetAndColorNum(21, cNumGenerator.red);
    ranges[5] = ColorMapUIEntry.fromOffsetAndColorNum(34, cNumGenerator.green);
    ranges[6] = ColorMapUIEntry.fromOffsetAndColorNum(55, cNumGenerator.blue);

    let n = ColorNumbers.getColorComponents(cNumGenerator.red);
    let h = ColorNumbers.getColorComponentsFromRgba('rgba(255,0,0,1)');
    let c = ColorNumbers.getColorComponentsFromCssColor("#FF0000");

    let t = ranges[1].colorNum;
    let n2 = ColorNumbers.getColorComponents(t);

    console.log('The color numbers are n:' + n + ' rgba:' + h + ' css:' + c + ' t: ' + t + ' n2: ' + n2);

    //ranges[7] = ColorMapUIEntry.fromOffsetAndColorNum(79, cNumGenerator.red);
    //ranges[8] = ColorMapUIEntry.fromOffsetAndColorNum(100, cNumGenerator.green);
    //ranges[9] = ColorMapUIEntry.fromOffsetAndColorNum(200, cNumGenerator.blue);

    //ranges[10] = new ColorMapUIEntry(500, [100, 200, 50]);
    //ranges[11] = new ColorMapUIEntry(800, [50, 240, 10]);
    //ranges[12] = new ColorMapUIEntry(1200, [245, 0, 80]);

    let result: ColorMapUI = new ColorMapUI(ranges, cNumGenerator.black);
    return result;
  }

}
