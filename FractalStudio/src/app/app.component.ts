import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';

import { IMapInfo, IPoint, Point, MapInfo, IBox, Box, ColorMap, ColorNumbers, ColorMapEntry, ColorMapUIEntry, ColorMapUI, IColorMap } from './m-map/m-map-common';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  public mapDisplayWidth: string = '1152px';
  public mapDisplayHeight: string = '768px';

  public colorEditorOffSet: string = '210px';
  public colorEditorWidth: string = '1159px';

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
  dataUri: string;

  history: IMapInfo[] = [];

  constructor() {
    const bottomLeft: IPoint = new Point(-2.4, -1.2);
    const topRight: IPoint = new Point(1, 1.2);

    this.mapCoords = new Box(bottomLeft, topRight);

    this.maxIterations = 130;
    this.iterationsPerStep = 10;
    this.mapInfo = new MapInfo(this.mapCoords, this.maxIterations, this.iterationsPerStep);

    this.colorMap = this.buildColorMap();

    this.mapDisplayHeight = '1152';
    this.mapDisplayWidth = '768';

    this.colorEditorOffSet = '1159'; // 7 pixels to accomodate border, margin and 1 pixel gap.
    this.colorEditorWidth = '210';
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
    let anchorTag = this.downloadRef.nativeElement as HTMLAnchorElement;
    anchorTag.hidden = !show;
  }

  private doTest(): void {
    let cMap = this.buildColorMap();
    let cMapEntry = new ColorMapEntry(15, ColorNumbers.getColor(30, 40, 60));

    cMap.insertColorMapEntry(cMapEntry, 1);
    this.colorMap = cMap;
  }

  private buildColorMap(): ColorMapUI {

    let cNumGenerator = new ColorNumbers();

    let ranges: ColorMapUIEntry[] = new Array<ColorMapUIEntry>(13);
    ranges[0] =  ColorMapUIEntry.fromOffsetAndColorNum(3, cNumGenerator.white);
    ranges[1] = ColorMapUIEntry.fromOffsetAndColorNum(5, cNumGenerator.red);
    ranges[2] = ColorMapUIEntry.fromOffsetAndColorNum(8, cNumGenerator.green);
    ranges[3] = ColorMapUIEntry.fromOffsetAndColorNum(13, cNumGenerator.blue);

    ranges[4] = ColorMapUIEntry.fromOffsetAndColorNum(21, cNumGenerator.red);
    ranges[5] = ColorMapUIEntry.fromOffsetAndColorNum(34, cNumGenerator.green);
    ranges[6] = ColorMapUIEntry.fromOffsetAndColorNum(55, cNumGenerator.blue);

    ranges[7] = ColorMapUIEntry.fromOffsetAndColorNum(79, cNumGenerator.red);
    ranges[8] = ColorMapUIEntry.fromOffsetAndColorNum(100, cNumGenerator.green);
    ranges[9] = ColorMapUIEntry.fromOffsetAndColorNum(200, cNumGenerator.blue);

    ranges[10] = new ColorMapUIEntry(500, [100, 200, 50]);
    ranges[11] = new ColorMapUIEntry(800, [50, 240, 10]);
    ranges[12] = new ColorMapUIEntry(1200, [245, 0, 80]);

    let result: ColorMapUI = new ColorMapUI(ranges, cNumGenerator.black);
    return result;
  }

}
