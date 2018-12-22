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

  public displaySize: ICanvasSize;
  public mapDisplayWidth: string;
  public mapDisplayHeight: string;

  @ViewChild('download') downloadRef: ElementRef;
  @ViewChild('mapDisplay') mapDisplayComponent: MMapDisplayComponent

  private virtualMap: IVirtualMap;

  public virtualMapParams: IVirtualMapParams = null;

  set virtualMapParamsProp(value: IVirtualMapParams) {
    if (value === null) {
      if (this.virtualMapParams !== null) {
        this.virtualMapParams = value;

        // Clear the virtual map and the current display.
        this.virtualMap = null;
        this.curViewCoords = null;
      }
    }
    else {
      let buildNewMap = false;
      //let updatePos = false;

      if (this.virtualMapParams === null) {
        buildNewMap = true;
      }
      else if (this.virtualMapParams.imageSize.width !== value.imageSize.width) {
        buildNewMap = true;
      }
      else if (this.virtualMapParams.scrToPrnPixRat !== value.scrToPrnPixRat) {
        buildNewMap = true;
      }
      //else {
      //  if (this._virtualMapParams.left !== value.left) {
      //    updatePos = true;
      //  }
      //  if (this._virtualMapParams.top !== value.top) {
      //    updatePos = true;
      //  }

      //}

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
        //if (updatePos) {
        //  if (this.virtualMap !== null) {
        //    this.curViewCoords = this.virtualMap.getCurCoords(value.left, value.top);
        //  }
        //}
      }

      this.updateParamsFromVirtualMap(value, this.virtualMap);

      console.log('Viewer component is updating its params property.');
      this.virtualMapParams = value;
    }
  }

  get virtualMapParamsProp(): IVirtualMapParams {
    return this.virtualMapParams;
  }

  // This is the map for the entir image being displayed.
  private _miwcm: MapInfoWithColorMap;
  set mapInfoWithColorMap(value: MapInfoWithColorMap) {

    this._miwcm = value;
    let coords: IBox = null;

    if (value !== null) {
      coords = value.mapInfo.coords;
    }

    let params = this.virtualMapParamsProp;
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

  public curMapInfoWithColorMap: MapInfoWithColorMap;
  public isBuilding: boolean = false;

  public ColorMapSerialNumber: number;
  public overLayBox: IBox;

  constructor() {
    this.curMapInfoWithColorMap = null;

    this.ColorMapSerialNumber = 0;

    this.mapInfoWithColorMap = null;
    this.virtualMap = null;

    this.displaySize = new CanvasSize(939, 626);
    this.mapDisplayWidth = this.displaySize.width.toString() + 'px';
    this.mapDisplayHeight = this.displaySize.height.toString() + 'px';

    this.virtualMapParamsProp = this.buildVirtualMapParams();

    //this.overLayBox = new Box(new Point(0.2, 0.2), new Point(0.7, 0.5));
    this.overLayBox = Box.fromPointExtent(new Point(0.5, 0.5), 0.5, 0.5); 
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

  // TODO: This updates the params argument as a side effect -- please fix.
  private createVirtualMap(coords: IBox, params: IVirtualMapParams, displaySize: ICanvasSize): IVirtualMap {
    let result = new VirtualMap(coords, params.imageSize, params.scrToPrnPixRat, displaySize);
    return result;
  }

  private updateParamsFromVirtualMap(params: IVirtualMapParams, virtualMap: IVirtualMap): void {

    if (virtualMap === null) {
      console.log('The Virtual Map is null on call to updateParamsFromVirtualMap.');
      params.imageSize = new CanvasSize(100, 100);
      return;
    }

    if (virtualMap.scrToPrnPixRat !== params.scrToPrnPixRat) {
      // The Virtual Map has adjusted the scrToPrnPixRat to valid value,
      // now update our value to match.
      params.scrToPrnPixRat = virtualMap.scrToPrnPixRat;
    }

    params.viewSize = virtualMap.getViewSize();
  }

  set curViewCoords(value: IBox) {
    console.log('Viewer component is updating its cur map property.');
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

  onVirtualMapParamsUpdated(params: IVirtualMapParams) {
    console.log('Viewer component is receiving a Params update.');
    //if (params !== null) {
    //  params.viewSize = this.displaySize;
    //}
    this.virtualMapParamsProp = params;
  }

  onMapPositionUpdated(ev: string) {
    console.log('Viewer Component is receiving a map pos update.');
    let dir = ev.substring(0, 1);
    //let percentage = ev.substring(1);

    let params = this.virtualMapParamsProp;

    if (params !== null) {
      let curLeft = this.virtualMapParamsProp.left;
      let curTop = this.virtualMapParamsProp.top;

      let newLeft = curLeft;
      let newTop = curTop;


      switch (dir) {
        case 'l':
          newLeft--;
          break;
        case 'r':
          newLeft++;
          break;
        case 'u':
          newTop--;
          break;
        case 'd':
          newTop++;
          break;
      }

      let newParams = new VirtualMapParams(params.imageSize, params.printDensity, params.scrToPrnPixRat, newLeft, newTop);
      this.updateParamsFromVirtualMap(newParams, this.virtualMap);
      this.virtualMapParamsProp = newParams;

      if (this.virtualMap !== null) {
        this.curViewCoords = this.virtualMap.getCurCoords(newLeft, newTop);
      }
    }

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
