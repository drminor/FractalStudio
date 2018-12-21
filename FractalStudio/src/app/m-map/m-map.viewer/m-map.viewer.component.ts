import { Component, ViewChild, ElementRef } from '@angular/core';

import {
  IPoint, Point, IMapInfo, MapInfo, IBox, Box,
  ColorMapUI,  MapInfoWithColorMap, Histogram, ICanvasSize, CanvasSize
} from '../../m-map/m-map-common';

import { IVirtualMap, VirtualMap, IVirtualMapParams, VirtualMapParams } from '../m-map-viewer-state';

import { MMapDisplayComponent } from '../../m-map/m-map.display/m-map.display.component';

@Component({
  selector: 'app-m-map-viewer',
  templateUrl: './m-map.viewer.component.html',
  styleUrls: ['./m-map.viewer.component.css']
})
export class MMapViewerComponent {

  //public imageSize: ICanvasSize; // Total number of pixels in print output.
  //public printDensity: number; // Pixels per linear inch.

  public displaySize: ICanvasSize;
  public mapDisplayWidth: string;
  public mapDisplayHeight: string;


  @ViewChild('download') downloadRef: ElementRef;
  @ViewChild('mapDisplay') mapDisplayComponent: MMapDisplayComponent

  private virtualMap: IVirtualMap;

  private _virtualMapParams: IVirtualMapParams = null;
  set virtualMapParams(value: IVirtualMapParams) {
    if (value === null) {
      if (this._virtualMapParams !== null) {
        this._virtualMapParams = value;

        // Clear the virtual map and the current display.
        this.virtualMap = null;
        this.curViewCoords = null;
      }
    }
    else {
      let buildNewMap = false;
      let updatePos = false;

      if (this._virtualMapParams === null) {
        buildNewMap = true;
      }
      else if (this._virtualMapParams.imageSize.width !== value.imageSize.width) {
        buildNewMap = true;
      }
      else if (this._virtualMapParams.scrToPrnPixRat !== value.scrToPrnPixRat) {
        buildNewMap = true;
      }
      else {
        if (this._virtualMapParams.left !== value.left) {
          updatePos = true;
        }
        if (this._virtualMapParams.top !== value.top) {
          updatePos = true;
        }

      }

      if (buildNewMap) {
        // Create a new VirtualMap.

        let coords: IBox;
        if (this._miwcm !== null && this._miwcm.mapInfo !== null) {
          coords = this._miwcm.mapInfo.coords;
        }
        else {
          coords = null;
        }

        this.virtualMap = this.createVirtualMap(coords, value, this.displaySize);
        this.updateParamsFromVirtualMap(value, this.virtualMap);
        this.curViewCoords = this.virtualMap.getCurCoords(value.left, value.top);
      }
      else {
        if (updatePos) {
          if (this.virtualMap !== null) {
            this.curViewCoords = this.virtualMap.getCurCoords(value.left, value.top);
          }
        }
      }
      this._virtualMapParams = value;
    }
  }

  get virtualMapParams(): IVirtualMapParams {
    return this._virtualMapParams;
  }

  // This is the map for the entir image being displayed.
  private _miwcm: MapInfoWithColorMap;
  set mapInfoWithColorMap(value: MapInfoWithColorMap) {

    this._miwcm = value;
    let coords: IBox = null;

    if (value !== null) {
      coords = value.mapInfo.coords;
    }

    let params = this.virtualMapParams;
    if (params !== null) {
      this.virtualMap = this.createVirtualMap(coords, params, this.displaySize);
      this.updateParamsFromVirtualMap(params, this.virtualMap);
      this.curViewCoords = this.virtualMap.getCurCoords(params.left, params.top);
    }
    else {
      this.curViewCoords = null;
    }
  }

  get mapInfoWithColorMap(): MapInfoWithColorMap {
    return this._miwcm;
  }

  curMapInfoWithColorMap: MapInfoWithColorMap;

  // TODO: This updates the params argument as a side effect -- please fix.
  private createVirtualMap(coords: IBox, params: IVirtualMapParams, displaySize: ICanvasSize) : IVirtualMap {
    let result = new VirtualMap(coords, params.imageSize, params.scrToPrnPixRat, displaySize);
    return result;
  }

  private updateParamsFromVirtualMap(params: IVirtualMapParams, virtualMap: IVirtualMap): void {

    if (virtualMap.scrToPrnPixRat !== params.scrToPrnPixRat) {
      // The Virtual Map has adjusted the scrToPrnPixRat to valid value,
      // now update our value to match.
      params.scrToPrnPixRat = virtualMap.scrToPrnPixRat;
    }

    params.viewSize = virtualMap.getViewSize();
  }

  set curViewCoords(value: IBox) {
    if (this._miwcm !== null) {

      let newMapInfo = new MapInfo(value, this._miwcm.mapInfo.maxIterations, this._miwcm.mapInfo.iterationsPerStep);
      let newMapInfoWithColorMap = new MapInfoWithColorMap(newMapInfo, this._miwcm.colorMapUi);
      this.curMapInfoWithColorMap = newMapInfoWithColorMap;

      this.isBuilding = true;
    }
    else {
      this.curMapInfoWithColorMap = null;
    }
  }

  isBuilding: boolean = false;

  public ColorMapSerialNumber: number;


  constructor() {
    this.curMapInfoWithColorMap = null;

    this.ColorMapSerialNumber = 0;

    this.mapInfoWithColorMap = null;
    this.virtualMap = null;

    this.displaySize = new CanvasSize(939, 626);
    this.mapDisplayWidth = this.displaySize.width.toString() + 'px';
    this.mapDisplayHeight = this.displaySize.height.toString() + 'px';

    this.virtualMapParams = this.buildVirtualMapParams();
  }

  private buildVirtualMapParams(): IVirtualMapParams {
    let imageSize = new CanvasSize(21600, 14400);
    let printDensity = 300;
    let scrToPrnPixRat = 10; // 23
    let left = 0;
    let top = 0;
    let result = new VirtualMapParams(imageSize, printDensity, scrToPrnPixRat, left, top);
    return result;
  }

  onVirtualMapParamsUpdated(params: IVirtualMapParams) {
    //if (params !== null) {
    //  params.viewSize = this.displaySize;
    //}
    this.virtualMapParams = params;
  }
  
  onBuildingComplete() {
    this.isBuilding = false;
  }

  onHaveHistogram(h: Histogram) {
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

  onMapInfoLoaded(miwcm: MapInfoWithColorMap) {
    this.updateDownloadLinkVisibility(false);

    if (miwcm.colorMapUi.serialNumber === -1) {
      miwcm.colorMapUi.serialNumber = this.ColorMapSerialNumber++;
    }

    this.mapInfoWithColorMap = miwcm;
  }

  private updateDownloadLinkVisibility(show: boolean): void {
    let anchorTag = this.downloadRef.nativeElement as HTMLAnchorElement;
    anchorTag.hidden = !show;
  }

}
