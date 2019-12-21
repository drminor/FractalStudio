import { Component, ViewChild, ElementRef, AfterViewInit} from '@angular/core';

import { IMapInfo, IBox,  Histogram, ICanvasSize, CanvasSize, Point, IPoint} from '../../m-map/m-map-common';

import { MapInfoWithColorMap, ColorMapUI } from '../m-map-common-ui';

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
export class MMapViewerComponent implements AfterViewInit {

  public mapDisplayWidth: string;
  public mapDisplayHeight: string;

  public overViewOffSet: string;
  public overViewWidth: string;
  public overViewHeight: string;

  @ViewChild('download') downloadRef: ElementRef;
  @ViewChild('mapDisplay') mapDisplayComponent: MMapDisplayComponent

  private viewInitialized: boolean;

  private _virtualMap: IVirtualMap;
  private _surveyMode: boolean = false;

  private _displaySize: ICanvasSize;
  set displaySize(value: ICanvasSize) {
    this._displaySize = value;
  }
  get displaySize(): ICanvasSize {
    if (this._displaySize === null) {
      return new CanvasSize(900, 600);
    }
    else {
      return this._displaySize;
    }
  }

  private _vmp: IVirtualMapParams = null;
  set virtualMapParams(value: IVirtualMapParams) {
    if (value === null) {
      if (this._vmp !== null) {
        this._vmp = value;

        // Clear the virtual map and the current display.
        this._virtualMap = null;
        this.curViewPosition = null;
      }
    }
    else {
      let buildNewMap = false;
      let updatePos = false;

      if (this._vmp === null || this._vmp.imageSize.width !== value.imageSize.width) {
        buildNewMap = true;
      }
      else {
        if (!this._vmp.position.isEqual(value.position)) {
          updatePos = true;
        }
      }

      if (buildNewMap) {
        console.log('Creating new Virtual Map at Set Map Params.');

        // Create a new VirtualMap and reset the position to 0.
        value.position = new Point(0, 0);
        this._virtualMap = new VirtualMap(value.imageSize, this.displaySize);

        this.overLayBox = this._virtualMap.getOverLayBox(value.position);
        this.curViewPosition = this._virtualMap.getCurCoords(value.position);
      }
      else {
        if (updatePos) {
          if (this._virtualMap !== null) {
            this.overLayBox = this._virtualMap.getOverLayBox(value.position);
            this.curViewPosition = this._virtualMap.getCurCoords(value.position);
          }
        }
      }

      console.log('Viewer component is updating its params property.');
      this._vmp = value;
    }
  }

  get virtualMapParams(): IVirtualMapParams {
    return this._vmp;
  }

  _colorMap: ColorMapUI = null;
  set colorMap(value: ColorMapUI) {
    if (this._colorMap === null || (this._colorMap !== null && value === null)) {
      console.log('Viewer component is Updating the color map.');
      this._colorMap = value;
    }
    else {
      if (this._colorMap.serialNumber !== value.serialNumber) {
        console.log('Viewer component is Updating the color map. The serial #s are different.');
        this._colorMap = value;
      }
      else {
        console.log('Viewer component is not updating the value of colorMap, the new serial #s match.');
      }
    }
  }

  get colorMap(): ColorMapUI {
    return this._colorMap;
  }

  // This is the map for the entire image being displayed.
  private _miwcm: MapInfoWithColorMap;
  set mapInfoWithColorMap(value: MapInfoWithColorMap) {

    let copy: MapInfoWithColorMap;

    if (value !== null) {
      copy = value.clone();
      // Set the Map Overview's map name to something different.
      copy.mapInfo.name = copy.mapInfo.name + '_OverView';
      this.colorMap = value.colorMapUi;
    }
    else {
      copy = null;
      this.colorMap = null;
    }

    this._miwcm = copy;
    //this._miwcm = null;

    let params = this.virtualMapParams;
    if (params !== null) {
      console.log('Creating new Virtual Map at Set MapInfo.');

      this._virtualMap = new VirtualMap(params.imageSize, this.displaySize);
      //params.name = value.mapInfo.name;
      //params.viewSize = this.displaySize;

      // SETTING OUR CUR MAP
      this.curMapInfoWithColorMap = value;
      this.overLayBox = this._virtualMap.getOverLayBox(params.position);
      this.curViewPosition = this._virtualMap.getCurCoords(params.position);
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
  public histogram: Histogram = null;
  public histogramForEntireArea: Histogram = null;
  public isBuilding: boolean = false;

  public ColorMapSerialNumber: number;
  public overLayBox: IBox = null;

  constructor() {
    this.viewInitialized = false;
    this.curArea = null;
    this.curMapInfoWithColorMap = null;

    this.ColorMapSerialNumber = 0;

    this.mapInfoWithColorMap = null;
    this._virtualMap = null;

    //this.displaySize = new CanvasSize(939, 626);
    //this.displaySize = new CanvasSize(900, 600);
    this.displaySize = null;

    this.mapDisplayWidth = this.displaySize.width.toString() + 'px';
    this.mapDisplayHeight = this.displaySize.height.toString() + 'px';

    this.overViewOffSet = '946px';
    this.overViewWidth = '384px';
    this.overViewHeight = '256px';

    //this.overLayBox = new Box(new Point(0.2, 0.2), new Point(0.7, 0.5));
    //this.overLayBox = Box.fromPointExtent(new Point(0.5, 0.5), 0.5, 0.5);
    this.overLayBox = null;
    this.virtualMapParams = this.buildVirtualMapParams();
  }

  private buildVirtualMapParams(): IVirtualMapParams {
    let name = 'VMapInfo';
    let iterations = 0;
    let imageSize = new CanvasSize(21, 14);
    let printDensity = 600;
    let displaySize = new CanvasSize(900, 600);
    let position = new Point(0, 0);
    let result = new VirtualMapParams(name, iterations, imageSize, printDensity, displaySize, position);
    return result;
  }

  set curViewPosition(value: IPoint) {
    if (value !== null) {
      console.log('Viewer component is updating its cur map property. The box is x:' + value.x + ' y:' + value.y + '.');
      this.curArea = new MapSection(value, this._virtualMap.imageSize);
      this.isBuilding = true;
    }
    else {
      console.log('Viewer component is updating its cur map property. The box is null.');
      this.curArea = null;
    }
  }

  ngAfterViewInit() {
    //if (!this.viewInitialized) {
    //  this.viewInitialized = true;
    //  this._displaySize = this.mapDisplayComponent.canvasSize;
    //}
  }

  onVirtualMapParamsUpdated(params: IVirtualMapParams) {
    console.log('Viewer component is receiving a Params update.');

    //if (params !== null) {
    //  if (this.displaySize === null) {
    //    console.log('The display size has not yet been set.');
    //  }

    //  params.viewSize = this.displaySize;
    //}

    this.virtualMapParams = params;
  }

  onMapPositionUpdated(ev: string) {
    console.log('Viewer Component is receiving a map pos update.');
    let dir = ev.substring(0, 1);
    let amount = parseFloat(ev.substring(1));

    let params = this.virtualMapParams;

    if (params !== null) {
      let newPosition = params.position.clone();

      switch (dir) {
        case 'l':
          newPosition.x -= amount;
          break;
        case 'r':
          newPosition.x += amount;
          break;
        case 'u':
          newPosition.y -= amount;
          break;
        case 'd':
          newPosition.y += amount;
          break;
      }

      this.updateMapPos(params, newPosition);
    }
  }

  private updateMapPos(params: IVirtualMapParams, newPosition: IPoint): void {
    let newParams = new VirtualMapParams(params.name, params.iterations, params.imageSizeInInches, params.printDensity, params.viewSize, newPosition);
    this.virtualMapParams = newParams;

    //if (this._virtualMap !== null) {
    //  this.overLayBox = this._virtualMap.getOverLayBox(newPosition);
    //  this.curViewPosition = this._virtualMap.getCurCoords(newPosition);
    //}
  }

  onBuildingComplete():void {
    this.isBuilding = false;

    if (!this._surveyMode) return;

    let params = this.virtualMapParams;

    if (params !== null) {
      let newPos = this._virtualMap.getNextCoords(params.position);
      //let newPos = this._virtualMap.getNextWorkCoords(params.position);

      if (newPos !== null)
        this.updateMapPos(params, newPos);
      else
        console.log('Completed the survey.');
    }
  }

  onColorMapUpdated(colorMap: ColorMapUI) {
    console.log('App Component is handling onColorMapUpdated.');
    this.updateDownloadLinkVisibility(false);

    if (colorMap.serialNumber === -1) {
      colorMap.serialNumber = this.ColorMapSerialNumber++;
    }

    // Update the color map, but keep the existing map info.
    //let mi = this._miwcm.mapInfo;
    let mi: IMapInfo;
    if (this.curMapInfoWithColorMap === null) {
      mi = null;
    }
    else {
      mi = this.curMapInfoWithColorMap.mapInfo;
    }

    this.curMapInfoWithColorMap = new MapInfoWithColorMap(mi, colorMap);

    if (this._miwcm === null) {
      mi = null;
    }
    else {
      mi = this._miwcm.mapInfo;
    }

    this._miwcm = new MapInfoWithColorMap(mi, colorMap);
  }

  onHaveHistogram(h: Histogram) {
    if (this.histogramForEntireArea === null) {
      console.log('We now have a histogram. It has ' + h.entriesMap.size + ' entries.');
      this.histogram = h;
    }
    else {
      console.log('Ignoring local histogam -- we are using the histogram for the entire area.');
    }
    this.isBuilding = false;
  }

  onHistogramRequested() {
    let mapDisplayTag  = this.mapDisplayComponent as MMapDisplayComponent;
    mapDisplayTag.getHistogram();
  }

  onHaveHistogramForEntireArea(h: Histogram) {
    console.log('We now have a histogram for the entire area. It has ' + h.entriesMap.size + ' entries.');
    this.histogramForEntireArea = h;
    this.histogram = h;
  }

  onSurveyModeUpdated(value: boolean) {
    this._surveyMode = value;

    if (value) {
      // Setting the survey mode to true.
      let params = this.virtualMapParams;

      if (params !== null) {
        let newPos: IPoint;

        if (params.position.isEqual(this._virtualMap.workStartPos)) {
          newPos = this._virtualMap.getNextCoords(params.position);
        }
        else {
          newPos = this._virtualMap.workStartPos;
        }
        this.updateMapPos(params, newPos);
      }
    }
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
    let params = this.virtualMapParams;
    let newParams = new VirtualMapParams(miwcm.mapInfo.name, miwcm.mapInfo.maxIterations, params.imageSizeInInches, params.printDensity, this.displaySize, new Point(0,0));
    this.virtualMapParams = newParams;

    this.mapInfoWithColorMap = miwcm;
  }

  private updateDownloadLinkVisibility(show: boolean): void {
    let anchorTag = this.downloadRef.nativeElement as HTMLAnchorElement;
    anchorTag.hidden = !show;
  }

}
