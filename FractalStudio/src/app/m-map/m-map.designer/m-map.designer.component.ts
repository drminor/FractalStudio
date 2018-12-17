import { Component, ViewChild, ElementRef } from '@angular/core';

import {
  IPoint, Point, IMapInfo, MapInfo, IBox, Box,
  ColorMapUI, ColorMapUIEntry, ColorNumbers, MapInfoWithColorMap,
  Histogram, Divisions
} from '../../m-map/m-map-common';

import { MMapDisplayComponent } from '../../m-map/m-map.display/m-map.display.component';

@Component({
  selector: 'app-m-map-designer',
  templateUrl: './m-map.designer.component.html',
  styleUrls: ['./m-map.designer.component.css']
})
export class MMapDesignerComponent {

  public mapDisplayWidth: string;
  public mapDisplayHeight: string;

  public colorEditorOffSet: string;
  public colorEditorWidth: string;

  @ViewChild('download') downloadRef: ElementRef;
  @ViewChild('mapDisplay') mapDisplayComponent: MMapDisplayComponent

  mapInfo: IMapInfo;

  _colorMap: ColorMapUI = null;
  set colorMap(value: ColorMapUI) {
    if (this._colorMap === null || (this._colorMap !== null && value === null)) {
      this._colorMap = value;
    }
    else {
      if (this._colorMap.serialNumber !== value.serialNumber) {
        this._colorMap = value;
      }
    }
  }

  get colorMap(): ColorMapUI {
    return this._colorMap;
  }

  private _miwcm: MapInfoWithColorMap;

  set mapInfoWithColorMap(value: MapInfoWithColorMap) {
    this._miwcm = value;
    this.colorMap = value.colorMapUi;
    this.mapInfo = value.mapInfo;
    this.isBuilding = true;
  }

  get mapInfoWithColorMap(): MapInfoWithColorMap {
    return this._miwcm;
  }

  histogram: Histogram;

  history: IMapInfo[] = [];
  isBuilding: boolean = false;
  atHome: boolean;

  sectionCnt: number;

  public ColorMapSerialNumber: number;

  constructor() {

    //this.doDivisionsTest();
    this.ColorMapSerialNumber = 0;

    let mi = this.buildMapInfo();
    let cm = this.buildColorMap(this.ColorMapSerialNumber++);

    this.mapInfoWithColorMap = new MapInfoWithColorMap(mi, cm);

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

    if (colorMap.serialNumber === -1) {
      colorMap.serialNumber = this.ColorMapSerialNumber++;
    }

    // Update the color map, but keep the existing map info.
    this.mapInfoWithColorMap = new MapInfoWithColorMap(this.mapInfo, colorMap);

    //this.colorMap = colorMap;
  }

  onBuildingComplete() {
    this.isBuilding = false;
  }

  onHaveHistogram(h: Histogram) {
    console.log('We now have a histogram. It has ' + h.entriesMap.size + ' entries.');

    console.log(h.toString());

    this.histogram = h;
    this.isBuilding = false;
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

    // Update the MapInfo, but keep the exiting colorMap.
    this.mapInfoWithColorMap = new MapInfoWithColorMap(mapInfo, this.colorMap);

    this.atHome = false;
  }

  onMapInfoLoaded(miwcm: MapInfoWithColorMap) {
    // Clear History.
    this.history = [];
    this.updateDownloadLinkVisibility(false);

    //// It is important to set the color map before setting the Map Info
    //// so as to avoid the display component having to do extra work.
    //console.log('MapInfoLoaded -- About to set the color map.');
    //this.colorMap = miwcm.colorMapUi;

    //console.log('MapInfoLoaded -- About to set the map info.');
    //this.mapInfo = miwcm.mapInfo;

    if (miwcm.colorMapUi.serialNumber === -1) {
      miwcm.colorMapUi.serialNumber = this.ColorMapSerialNumber++;
    }

    this.mapInfoWithColorMap = miwcm;

    this.atHome = false;
  }

  onZoomed(mapCoords: IBox) {
    console.log('Received the updated mapinfo from zoom ' + mapCoords.botLeft.x + '.');
    this.history.push(this.mapInfo);
    this.updateDownloadLinkVisibility(false);

    //this.mapInfo = new MapInfo(mapCoords, this.mapInfo.maxIterations, this.mapInfo.iterationsPerStep, this.mapInfo.upsideDown);

    // Build a new MapInfo using the existing Max Iterations and IterationsPerStep
    let mi = new MapInfo(mapCoords, this.mapInfo.maxIterations, this.mapInfo.iterationsPerStep);

    // Update the MapInfo, keeping the existing Color Map.
    this.mapInfoWithColorMap = new MapInfoWithColorMap(mi, this.colorMap);

    this.atHome = false;
  }

  // Handles Back and Reset operations.
  onGoBack(steps: number) {
    if (steps === -1) {
      if (!this.atHome) {
        this.history = [];

        let mi = this.buildMapInfo();
        let cm = this.buildColorMap(this.ColorMapSerialNumber++);
        this.mapInfoWithColorMap = new MapInfoWithColorMap(mi, cm);
        this.atHome = true;
      }
    }
    else if (steps === 1) {
      // Go Back 1 step
      if (this.history.length > 0) {
        let mi = this.history.pop();
        this.mapInfoWithColorMap = new MapInfoWithColorMap(mi, this.colorMap);
      }
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

  private buildMapInfo(): IMapInfo {
    const bottomLeft: IPoint = new Point(-2.4, -1.2);
    const topRight: IPoint = new Point(1.2, 1.2);

    let mapCoords = new Box(bottomLeft, topRight);

    let maxIterations = 100;
    let iterationsPerStep = 10;
    let result = new MapInfo(mapCoords, maxIterations, iterationsPerStep);

    return result;
  }

  private buildColorMap(serialNumber: number): ColorMapUI {

    let cNumGenerator = new ColorNumbers();

    let ranges: ColorMapUIEntry[] = new Array<ColorMapUIEntry>(7);
    ranges[0] = ColorMapUIEntry.fromOffsetAndColorNum(3, cNumGenerator.white);
    ranges[1] = ColorMapUIEntry.fromOffsetAndColorNum(5, cNumGenerator.red);
    ranges[2] = ColorMapUIEntry.fromOffsetAndColorNum(8, cNumGenerator.green);
    ranges[3] = ColorMapUIEntry.fromOffsetAndColorNum(13, cNumGenerator.blue);

    ranges[4] = ColorMapUIEntry.fromOffsetAndColorNum(21, cNumGenerator.red);
    ranges[5] = ColorMapUIEntry.fromOffsetAndColorNum(34, cNumGenerator.green);
    ranges[6] = ColorMapUIEntry.fromOffsetAndColorNum(55, cNumGenerator.blue);

    let result: ColorMapUI = new ColorMapUI(ranges, '#000000', serialNumber);
    return result;
  }

  private doDivisionsTest() {
    let div: Divisions = new Divisions(5);
    div.children[0].numberOfDivs = 3;
    div.children[4].numberOfDivs = 3;

    div.children[4].insertChild(new Divisions(1), 1);
    div.children[0].deleteChild(1);

    let div2: Divisions = new Divisions(2);
    div2.children[1].numberOfDivs = 2;

    div.insertChild(div2, 5);

    let startingVals = div.getStartingValsAsPercentages();
    console.log('The starting vals are ' + startingVals + '.');

    let divDisplay = div.toString();
    console.log('The divisions are: ' + divDisplay);
  }

}