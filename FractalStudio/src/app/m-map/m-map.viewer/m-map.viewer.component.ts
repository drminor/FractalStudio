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

  private _virtualMapParams: IVirtualMapParams;
  set virtualMapParams(value: IVirtualMapParams) {
    if (value === null) {
      if (this._virtualMapParams !== null) {
        this._virtualMapParams = value;
        // TODO: Clear the existing VirtualMap and set our mapInfoWithColorMap to null.
      }
    }
    else {
      let shouldUpdate = false;
      if (this._virtualMapParams === null) {
        shouldUpdate = true;
      }
      else {
        if (this._virtualMapParams.imageSize.width !== value.imageSize.width) {
          shouldUpdate = true;
        }
        if (this._virtualMapParams.scrToPrnPixRat !== value.scrToPrnPixRat) {
          shouldUpdate = true;
        }
      }
      if (shouldUpdate) {
        // Create a new VirtualMap.
        let coords: IBox = null;

        if (this._miwcm !== null) {
          if (this._miwcm.mapInfo !== null) {
            coords = this._miwcm.mapInfo.coords;
          }
        }
        this.virtualMap = new VirtualMap(coords, value.imageSize, value.scrToPrnPixRat, this.displaySize);
        value.viewSize = this.virtualMap.getViewSize();
        this._virtualMapParams = value;

        // TODO: Set our mapInfoWithColorMap using our new VirtualMap.
      }

    }

  }
  get virtualMapParams(): IVirtualMapParams {
    return this._virtualMapParams;
  }

  private _miwcm: MapInfoWithColorMap;
  set mapInfoWithColorMap(value: MapInfoWithColorMap) {

    if (value === null) {
      value = new MapInfoWithColorMap(null, null);
    }

    this._miwcm = value;
    this.isBuilding = true;
  }

  get mapInfoWithColorMap(): MapInfoWithColorMap {
    return this._miwcm;
  }



  isBuilding: boolean = false;

  public ColorMapSerialNumber: number;


  constructor() {

    this.ColorMapSerialNumber = 0;

    this.mapInfoWithColorMap = null;
    this.virtualMap = null;

    this.displaySize = new CanvasSize(939, 626);
    this.mapDisplayWidth = this.displaySize.width.toString() + 'px';
    this.mapDisplayHeight = this.displaySize.height.toString() + 'px';

    this._virtualMapParams = this.buildVirtualMapParams();
  }

  private buildVirtualMapParams(): IVirtualMapParams {
    let imageSize = new CanvasSize(21600, 14400);
    let printDensity = 300;
    let scrToPrnPixRat = 23;
    let result = new VirtualMapParams(imageSize, printDensity, scrToPrnPixRat);
    result.viewSize = this.displaySize;
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
