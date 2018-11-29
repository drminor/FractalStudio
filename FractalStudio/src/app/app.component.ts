import { Component, ViewChild, ElementRef } from '@angular/core';

import {
  IPoint, Point, IMapInfo, MapInfo, IBox, Box,
  ColorMapUI, ColorMapUIEntry, ColorNumbers, MapInfoWithColorMap,
  Histogram, Divisions
} from './m-map/m-map-common';
import { MMapDisplayComponent } from './m-map/m-map.display/m-map.display.component';



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
  @ViewChild('mapDisplay') mapDisplayComponent: MMapDisplayComponent

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

  colorMap: ColorMapUI;
  histogram: Histogram;

  history: IMapInfo[] = [];
  atHome: boolean;

  sectionCnt: number;

  constructor() {

    //this.doDivisionsTest();

    this.mapInfo = this.buildMapInfo();
    this.colorMap = this.buildColorMap();
    this.histogram = null;

    this.atHome = true;
    this.sectionCnt = 10;

    this.mapDisplayWidth = '939px';
    this.mapDisplayHeight = '626px';

    this.colorEditorOffSet = '946px'; // 7 pixels to accomodate border, margin and 1 pixel gap.
    this.colorEditorWidth = '385px';
  }

  onColorMapUpdated(colorMap: ColorMapUI) {
    console.log('App Component is handling onColorMapUpdated.');
    this.updateDownloadLinkVisibility(false);
    this.colorMap = colorMap;
  }

  onHaveHistogram(h: Histogram) {
    console.log('We now have a histogram. It has ' + h.entriesMap.size + ' entries.');
    this.histogram = h;
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

    this.mapInfo = miwcm.mapInfo;
    this.colorMap = miwcm.colorMapUi;

    this.atHome = false;
  }

  onZoomed(mapCoords: IBox) {
    console.log('Received the updated mapinfo from zoom ' + mapCoords.botLeft.x + '.');
    this.history.push(this.mapInfo);
    this.updateDownloadLinkVisibility(false);
    this.mapInfo = new MapInfo(mapCoords, this.mapInfo.maxIterations, this.mapInfo.iterationsPerStep, this.mapInfo.upsideDown);
    this.atHome = false;
  }

  // Handles Back and Reset operations.
  onGoBack(steps: number) {
    if (steps === -1) {
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
    //else if (steps === 2) {
    //  // Just for testing
    //  this.doTest();
    //}
    else {
      throw new RangeError('Steps must be 1 or -1.');
    }

    this.updateDownloadLinkVisibility(false);
  }

  private updateDownloadLinkVisibility(show: boolean): void {
    let anchorTag = this.downloadRef.nativeElement as HTMLAnchorElement;
    anchorTag.hidden = !show;
  }

  //private doTest(): void {
  //  let cMap = this.buildColorMap();
  //  let cMapEntry = new ColorMapEntry(15, ColorNumbers.getColor(30, 40, 60));

  //  cMap.insertColorMapEntry(cMapEntry, 1);
  //  this.colorMap = cMap;
  //}

  private buildMapInfo(): IMapInfo {
    const bottomLeft: IPoint = new Point(-2.4, -1.2);
    const topRight: IPoint = new Point(1, 1.2);

    let mapCoords = new Box(bottomLeft, topRight);

    let maxIterations = 100;
    let iterationsPerStep = 10;
    let result = new MapInfo(mapCoords, maxIterations, iterationsPerStep, false);

    return result;
  }

  private buildColorMap(): ColorMapUI {

    let cNumGenerator = new ColorNumbers();

    let ranges: ColorMapUIEntry[] = new Array<ColorMapUIEntry>(7);
    ranges[0] = ColorMapUIEntry.fromOffsetAndColorNum(3, 0, cNumGenerator.white);
    ranges[1] = ColorMapUIEntry.fromOffsetAndColorNum(5, 0, cNumGenerator.red);
    ranges[2] = ColorMapUIEntry.fromOffsetAndColorNum(8, 0, cNumGenerator.green);
    ranges[3] = ColorMapUIEntry.fromOffsetAndColorNum(13, 0, cNumGenerator.blue);

    ranges[4] = ColorMapUIEntry.fromOffsetAndColorNum(21, 0, cNumGenerator.red);
    ranges[5] = ColorMapUIEntry.fromOffsetAndColorNum(34, 0, cNumGenerator.green);
    ranges[6] = ColorMapUIEntry.fromOffsetAndColorNum(55, 0, cNumGenerator.blue);

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

  private doDivisionsTest() {
    let div: Divisions = new Divisions(1, 0, 0, 5);
    div.children[0].numberOfDivs = 3;
    div.children[4].numberOfDivs = 3;

    div.children[4].insertChild(new Divisions(1, 0, 0, 1), 1);
    div.children[0].deleteChild(1);

    let div2: Divisions = new Divisions(1, 0, 0, 2);
    div2.children[1].numberOfDivs = 2;

    div.insertChild(div2, 5);

    let startingVals = div.getStartingValsAsPercentages();
    console.log('The starting vals are ' + startingVals + '.');

    let divDisplay = div.toString();
    console.log('The divisions are: ' + divDisplay);
  }

}
