import { Component, ViewChild, ElementRef } from '@angular/core';

import { MapInfo, IBox, Box,  Histogram, ICanvasSize, CanvasSize, SCoords, Point, IPoint} from '../../m-map/m-map-common';

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
  public surveyMode: boolean = false;

  set virtualMapParamsProp(value: IVirtualMapParams) {
    if (value === null) {
      if (this.virtualMapParams !== null) {
        this.virtualMapParams = value;

        // Clear the virtual map and the current display.
        this.virtualMap = null;
        this.curViewPosition = null;
      }
    }
    else {
      let buildNewMap = false;
      let updatePos = false;

      if (this.virtualMapParams === null) {
        buildNewMap = true;
      }
      else if (this.virtualMapParams.imageSize.width !== value.imageSize.width) {
        buildNewMap = true;
      }
      else {
        if (this.virtualMapParams.left !== value.left ||
          this.virtualMapParams.top !== value.top) {
          updatePos = true;
        }
      }

      if (this.displaySize === null) {
        console.log('Initing the display size on set params prop.');
        this.displaySize = new CanvasSize(939, 626);
      }

      if (buildNewMap) {

        // Create a new VirtualMap.

        // Reset the position to 0.
        value.left = 0;
        value.top = 0;

        console.log('Creating new Virtual Map at Set Map Params.');

        this.virtualMap = new VirtualMap(value.imageSize, this.displaySize);
        value.viewSize = this.displaySize;
        //this.updateParamsFromVirtualMap(value, this.virtualMap);
        this.overLayBox = this.virtualMap.getOverLayBox(value.left, value.top);

        // WE ARE NOT SETTING OUR CUR MAP
        this.curViewPosition = this.virtualMap.getCurCoords(value.left, value.top);
      }
      else {
        if (updatePos) {
          if (this.virtualMap !== null) {
            value.viewSize = this.displaySize;
            //this.updateParamsFromVirtualMap(value, this.virtualMap);
            this.overLayBox = this.virtualMap.getOverLayBox(value.left, value.top);
            this.curViewPosition = this.virtualMap.getCurCoords(value.left, value.top);
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

    let copy: MapInfoWithColorMap;

    if (value !== null) {
      copy = value.clone();
      // Set the Map Overview's map name to something different.
      copy.mapInfo.name = copy.mapInfo.name + '_OverView';
    }
    else {
      copy = null;
    }

    this._miwcm = copy;

    let params = this.virtualMapParamsProp;
    if (params !== null) {
      console.log('Creating new Virtual Map at Set MapInfo.');

      this.virtualMap = new VirtualMap(params.imageSize, this.displaySize);
      params.name = value.mapInfo.name;
      params.viewSize = this.displaySize;

      // SETTING OUR CUR MAP
      this.curMapInfoWithColorMap = value;
      this.overLayBox = this.virtualMap.getOverLayBox(params.left, params.top);
      this.curViewPosition = this.virtualMap.getCurCoords(params.left, params.top);
    }
    else {
      this.curViewPosition = null;
    }
  }

  get mapInfoWithColorMap(): MapInfoWithColorMap {
    return this._miwcm;
  }

  public curArea: MapSection;
  public curMapInfoWithColorMap: MapInfoWithColorMap;
  public isBuilding: boolean = false;

  public ColorMapSerialNumber: number;
  public overLayBox: IBox;

  constructor(private fService: FracServerService) {
    this.curArea = null;
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
    let imageSize = new CanvasSize(36, 24);
    let printDensity = 300;
    //let scrToPrnPixRat = 10; // 23
    let left = 0;
    let top = 0;
    let result = new VirtualMapParams(name, imageSize, printDensity, left, top);
    return result;
  }

  set curViewPosition(value: IPoint) {
    if (value !== null) {
      console.log('Viewer component is updating its cur map property. The box is x:' + value.x + ' y:' + value.y + '.');
      this.curArea = new MapSection(value, this.virtualMap.imageSize);
      this.isBuilding = true;
    }
    else {
      console.log('Viewer component is updating its cur map property. The box is null.');
      this.curArea = null;
    }
  }

  onVirtualMapParamsUpdated(params: IVirtualMapParams) {
    console.log('Viewer component is receiving a Params update.');

    if (params !== null) {
      if (this.displaySize === null) {
        console.log('The display size has not yet been set.');
      }

      params.viewSize = this.displaySize;
    }

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

      this.updateMapPos(params, newLeft, newTop);
    }
  }

  private updateMapPos(params: IVirtualMapParams, newLeft: number, newTop: number): void {
    let newParams = new VirtualMapParams(params.name, params.imageSizeInInches, params.printDensity, newLeft, newTop);
    newParams.viewSize = this.displaySize;
    this.virtualMapParamsProp = newParams;

    if (this.virtualMap !== null) {
      this.overLayBox = this.virtualMap.getOverLayBox(newLeft, newTop);
      this.curViewPosition = this.virtualMap.getCurCoords(newLeft, newTop);
    }
  }

  onBuildingComplete():void {
    this.isBuilding = false;

    if (!this.surveyMode) return;

    let params = this.virtualMapParamsProp;

    if (params !== null) {
      let curLeft = this.virtualMapParamsProp.left;
      let curTop = this.virtualMapParamsProp.top;

      let newPos = this.virtualMap.getNextCoords(curLeft, curTop);
      if (newPos !== null)
        this.updateMapPos(params, newPos.x, newPos.y);
      else
        console.log('Completed the survey.');
    }
  }

  onHaveHistogram(h: Histogram) {
    this.isBuilding = false;
  }

  onSurveyModeUpdated(value: boolean) {
    this.surveyMode = value;

    if(value)
      this.curViewPosition = new Point(0, 0);
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

    // Update the Parameters screen with the new info.
    let params = this.virtualMapParamsProp;
    let newParams = new VirtualMapParams(params.name, params.imageSizeInInches, params.printDensity, 0, 0);
    newParams.viewSize = this.displaySize;
    this.virtualMapParamsProp = newParams;

    this.mapInfoWithColorMap = miwcm;
  }

  private updateDownloadLinkVisibility(show: boolean): void {
    let anchorTag = this.downloadRef.nativeElement as HTMLAnchorElement;
    anchorTag.hidden = !show;
  }

}
