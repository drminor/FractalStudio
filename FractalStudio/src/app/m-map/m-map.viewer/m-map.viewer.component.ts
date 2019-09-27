import { Component, ViewChild, ElementRef } from '@angular/core';

import { MapInfo, IBox, Box,  Histogram, ICanvasSize, CanvasSize, SCoords} from '../../m-map/m-map-common';

import { MapInfoWithColorMap } from '../m-map-common-ui';

import { IVirtualMap, VirtualMap, IVirtualMapParams, VirtualMapParams } from '../m-map-viewer-state';

import { MMapDisplayComponent } from '../../m-map/m-map.display/m-map.display.component';

import { MapSection, MapSectionResult, SMapWorkRequest, SCoordsWorkRequest, TransformType } from '../../m-map/m-map-common-server';
import { FracServerService } from '../../frac-server/frac-server.service';


@Component({
  selector: 'app-m-map-viewer',
  templateUrl: './m-map.viewer.component.html',
  styleUrls: ['./m-map.viewer.component.css'],
  providers: [FracServerService]
})
export class MMapViewerComponent {

  public displaySize: ICanvasSize;

  public mapDisplayWidth: string;
  public mapDisplayHeight: string;
  public overViewOffSet: string;
  public overViewWidth: string;
  public overViewHeight: string;

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
      let updatePos = false;

      if (this.virtualMapParams === null) {
        buildNewMap = true;
      }
      else if (this.virtualMapParams.imageSize.width !== value.imageSize.width
        || this.virtualMapParams.scrToPrnPixRat !== value.scrToPrnPixRat) {
        buildNewMap = true;
      }
      else {
        if (this.virtualMapParams.left !== value.left) {
          updatePos = true;
        }
        if (this.virtualMapParams.top !== value.top) {
          updatePos = true;
        }

      }

      if (buildNewMap) {
        // Create a new VirtualMap.

        // Reset the position to 0.
        value.left = 0;
        value.top = 0;

        let coords: IBox;
        if (this._miwcm !== null && this._miwcm.mapInfo !== null) {
          // TODO: sc.Don't convert SCoords to IBox
          coords = Box.fromSCoords(this._miwcm.mapInfo.sCoords);
          //coords = this._miwcm.mapInfo.coords;
        }
        else {
          coords = null;
        }

        this.virtualMap = this.createVirtualMap(value.name, coords, value, this.displaySize);
        this.updateParamsFromVirtualMap(value, this.virtualMap);
        this.overLayBox = this.virtualMap.getOverLayBox(value.left, value.top);
        this.curViewCoords = this.virtualMap.getCurCoords(value.left, value.top);
      }
      else {
        if (updatePos) {
          if (this.virtualMap !== null) {
            this.updateParamsFromVirtualMap(value, this.virtualMap);
            this.overLayBox = this.virtualMap.getOverLayBox(value.left, value.top);
            this.curViewCoords = this.virtualMap.getCurCoords(value.left, value.top);
          }
        }
      }

      console.log('Viewer component is updating its params property.');
      this.virtualMapParams = value;
    }
  }

  get virtualMapParamsProp(): IVirtualMapParams {
    return this.virtualMapParams;
  }

  // This is the map for the entire image being displayed.
  private _miwcm: MapInfoWithColorMap;
  set mapInfoWithColorMap(value: MapInfoWithColorMap) {

    // The name from the loaded MapInfo file.
    let mapInfoName: string = null;
    let coords: IBox = null;

    if (value !== null) {
      mapInfoName = value.mapInfo.name;

      // Set the Map Overview's map name to something different.
      value.mapInfo.name = mapInfoName + '_OverView';

      //coords = value.mapInfo.coords;
      // TODO: sc.Don't convert SCoords to IBox
      coords = Box.fromSCoords(value.mapInfo.sCoords);
    }

    this._miwcm = value;

    let params = this.virtualMapParamsProp;
    if (params !== null) {
      this.virtualMap = this.createVirtualMap(mapInfoName, coords, params, this.displaySize);
      this.updateParamsFromVirtualMap(params, this.virtualMap);
      this.overLayBox = this.virtualMap.getOverLayBox(params.left, params.top);
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

  constructor(private fService: FracServerService) {
    this.curMapInfoWithColorMap = null;

    this.ColorMapSerialNumber = 0;

    this.mapInfoWithColorMap = null;
    this.virtualMap = null;

    this.displaySize = new CanvasSize(939, 626);
    this.mapDisplayWidth = this.displaySize.width.toString() + 'px';
    this.mapDisplayHeight = this.displaySize.height.toString() + 'px';

    this.overViewOffSet = '946px';
    this.overViewWidth = '384px';
    this.overViewHeight = '256px';

    this.virtualMapParamsProp = this.buildVirtualMapParams();

    //this.overLayBox = new Box(new Point(0.2, 0.2), new Point(0.7, 0.5));
    //this.overLayBox = Box.fromPointExtent(new Point(0.5, 0.5), 0.5, 0.5);
    this.overLayBox = null;
  }

  private buildVirtualMapParams(): IVirtualMapParams {
    let name = 'VMapInfo';
    let imageSize = new CanvasSize(21600, 14400);
    let printDensity = 300;
    let scrToPrnPixRat = 10; // 23
    let left = 0;
    let top = 0;
    let result = new VirtualMapParams(name, imageSize, printDensity, scrToPrnPixRat, left, top);
    return result;
  }

  private createVirtualMap(name: string, coords: IBox, params: IVirtualMapParams, displaySize: ICanvasSize): IVirtualMap {
    let result = new VirtualMap(name, coords, params.imageSize, params.scrToPrnPixRat, displaySize);
    return result;
  }

  private updateParamsFromVirtualMap(params: IVirtualMapParams, virtualMap: IVirtualMap): void {

    if (virtualMap === null) {
      console.log('The Virtual Map is null on call to updateParamsFromVirtualMap.');
      params.imageSize = new CanvasSize(100, 100);
      return;
    }

    params.name = virtualMap.name;

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
      let cmi = this._miwcm.mapInfo;
      let coords = SCoords.fromBox(value);

      // Use the name of the entire virtual map to build the curMapInfo
      let name = this.virtualMapParamsProp.name;

      console.log('Creating a new MapInfo for the current frame with name = ' + name + '.');
      let newMapInfo = new MapInfo(name, coords, cmi.maxIterations, cmi.threshold, cmi.iterationsPerStep);
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
    let amount = parseFloat(ev.substring(1));

    let params = this.virtualMapParamsProp;

    if (params !== null) {
      let curLeft = this.virtualMapParamsProp.left;
      let curTop = this.virtualMapParamsProp.top;

      let newLeft = curLeft;
      let newTop = curTop;

      switch (dir) {
        case 'l':
          newLeft -= amount;
          break;
        case 'r':
          newLeft += amount;
          break;
        case 'u':
          newTop -= amount;
          break;
        case 'd':
          newTop += amount;
          break;
      }

      let newParams = new VirtualMapParams(params.name, params.imageSize, params.printDensity, params.scrToPrnPixRat, newLeft, newTop);
      this.updateParamsFromVirtualMap(newParams, this.virtualMap);
      this.virtualMapParamsProp = newParams;

      if (this.virtualMap !== null) {
        this.overLayBox = this.virtualMap.getOverLayBox(newLeft, newTop);
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
