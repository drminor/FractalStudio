import { Component, ViewChild, ElementRef } from '@angular/core';

import { ColorNumbers } from '../../m-map/ColorNumbers';

import {
  IPoint, Point, IBox, Box,
  ColorMapEntryBlendStyle,
  IMapInfo, MapInfo, Histogram,
  apRational, RoundingMode, apRationalSettings
} from '../../m-map/m-map-common';

import { ColorMapUI, ColorMapUIEntry, ColorMapForExport, MapInfoWithColorMap, MapInfoWithColorMapForExport } from '../m-map-common-ui';

//import { apRational, RoundingMode, apRationalSettings } from '../../apMath/apRational';

import { apsrRational, apsrRationalSettings } from '../../apMath/apsrRational';


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

    //this.doApRatTest();
    //this.doApRatTest2();
    this.doApRatTest3();

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

    //console.log(h.toString());

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
    let mi = new MapInfo(mapCoords, this.mapInfo.maxIterations, this.mapInfo.threshold, this.mapInfo.iterationsPerStep);

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
    let threshold = 4;
    let iterationsPerStep = 10;
    let result = new MapInfo(mapCoords, maxIterations, threshold, iterationsPerStep);

    return result;
  }

  private buildColorMap(serialNumber: number): ColorMapUI {

    //let cNumGenerator = new ColorNumbers();

    let ranges: ColorMapUIEntry[] = new Array<ColorMapUIEntry>(7);
    ranges[0] = ColorMapUIEntry.fromOffsetAndColorNum(3, ColorNumbers.white, ColorMapEntryBlendStyle.none, ColorNumbers.black);
    ranges[1] = ColorMapUIEntry.fromOffsetAndColorNum(5, ColorNumbers.red, ColorMapEntryBlendStyle.none, ColorNumbers.black);
    ranges[2] = ColorMapUIEntry.fromOffsetAndColorNum(8, ColorNumbers.green, ColorMapEntryBlendStyle.none, ColorNumbers.black);
    ranges[3] = ColorMapUIEntry.fromOffsetAndColorNum(13, ColorNumbers.blue, ColorMapEntryBlendStyle.none, ColorNumbers.black);

    ranges[4] = ColorMapUIEntry.fromOffsetAndColorNum(21, ColorNumbers.red, ColorMapEntryBlendStyle.none, ColorNumbers.black);
    ranges[5] = ColorMapUIEntry.fromOffsetAndColorNum(34, ColorNumbers.green, ColorMapEntryBlendStyle.none, ColorNumbers.black);
    ranges[6] = ColorMapUIEntry.fromOffsetAndColorNum(55, ColorNumbers.blue, ColorMapEntryBlendStyle.none, ColorNumbers.black);

    let result: ColorMapUI = new ColorMapUI(ranges, '#000000', serialNumber);
    return result;
  }

  private doApRatTest3() {

    let apRatSettings = new apsrRationalSettings(25, 7);

    let x = apRatSettings.parse(105.001);
    console.log('X is ' + x.toString() + ' fancy:' + x.toStringF());

    let y = apRatSettings.parse('0.000456789'); 
    console.log('Y is ' + y.toString() + ' fancy:' + y.toStringF());

    let z = y.clone().roundCustom(5);
    console.log('Z is ' + z.toString() + ' fancy:' + z.toStringF());

  }

  private doApRatTest2() {

    let apRatSettings = new apRationalSettings(25, RoundingMode.HalfUp);

    let x = apRatSettings.parse(1.001);
    let y = x.clone();

    let ptr = 0;

    for (; ptr < 100; ptr++) {
      y.multiply(x);
      console.log('At interation ' + ptr + ' Y is ' + y.toFixed() + ' raw: ' + y.toString());
    }
  }

  private doApRatTest() {

    let apRatTestSettings = new apRationalSettings(10, RoundingMode.HalfUp);
    apRatTestSettings.posExp = 4;
    apRatTestSettings.negExp = 3;

    let x: apRational = apRational.parse('-0.000035123', apRatTestSettings);
    console.log('Created a apRational with value = ' + x.toString());

    let s = x.stringify();
    console.log('Stringify of x = |' + s + '|');

    let a = apRatTestSettings.parse('201.123456789123456789');

    this.reportApRatValue('A', a);
    let b = a.clone().round();
    this.reportApRatValue('A Rounded', b);

    let apRatSettings = new apRationalSettings(15, RoundingMode.HalfUp);
    apRatSettings.posExp = 20;
    apRatSettings.negExp = 8;

    //let c = apRational.parse('0.00000000123456789123456789', apRatSettings);
    let c = apRatSettings.parse('0.00000000123456789123456789');

    this.reportApRatValue('C', c);
    let d = c.clone().round();
    this.reportApRatValue('C rounded', d);

    let m = c.clone().multiply(d);
    this.reportApRatValue('C * D', m);

    let nc = m.clone().divide(d);
    this.reportApRatValue('C * D / D', nc);

    let m2 = a.clone().multiply(c);
    this.reportApRatValue('A * C', m2);

    let nc2 = m2.divide(c);
    this.reportApRatValue('A * C / C', nc2);

    a = apRatSettings.parse('2.3');

    let p = a.clone().plus(a);
    this.reportApRatValue('A + A', p);

    let p2 = p.clone().plus(c);
    this.reportApRatValue('A + A + C', p2);

    let u = p.clone().minus(a);
    this.reportApRatValue('A + A - A', u);

    let u2 = p2.clone().minus(c);
    this.reportApRatValue('A + A + C - C', u2);
  }

  private reportApRatValue(name:string, x: apRational): void {
    let f = x.toFixed();
    let e = x.toExponential();
    console.log(name + '= ' + f + ' (' + e + ')');
  }

}
