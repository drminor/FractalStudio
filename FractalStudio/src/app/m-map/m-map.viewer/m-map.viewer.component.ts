import { Component, ViewChild, ElementRef } from '@angular/core';

import {
  IPoint, Point, IMapInfo, MapInfo, IBox, Box,
  ColorMapUI, ColorMapUIEntry, ColorNumbers, MapInfoWithColorMap,
  Histogram, Divisions
} from '../../m-map/m-map-common';

import { MMapDisplayComponent } from '../../m-map/m-map.display/m-map.display.component';

@Component({
  selector: 'app-m-map-viewer',
  templateUrl: './m-map.viewer.component.html',
  styleUrls: ['./m-map.viewer.component.css']
})
export class MMapViewerComponent {
  public mapDisplayWidth: string;
  public mapDisplayHeight: string;


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

    if (value === null) {
      value = new MapInfoWithColorMap(null, null);
    }

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

    this.ColorMapSerialNumber = 0;

    this.mapInfoWithColorMap = null;

    this.histogram = null;

    this.atHome = true;
    this.sectionCnt = 10;

    this.mapDisplayWidth = '939px';
    this.mapDisplayHeight = '626px';
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

        this.mapInfoWithColorMap = null;
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


}
