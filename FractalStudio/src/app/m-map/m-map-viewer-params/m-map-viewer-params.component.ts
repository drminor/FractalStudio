import { Component, EventEmitter, Output, Input, ViewChild, ElementRef } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

import { IBox, IMapInfo, MapInfo, MapInfoWithColorMap, MapInfoWithColorMapForExport, ICanvasSize, CanvasSize } from '../m-map-common';
import { IVirtualMapParams, VirtualMapParams } from '../m-map-viewer-state';

@Component({
  selector: 'app-m-map-viewer-params',
  templateUrl: './m-map-viewer-params.component.html',
  styleUrls: ['./m-map-viewer-params.component.css']
})
export class MMapViewerParamsComponent {


  public mapViewForm: FormGroup;


  private _virtualMapParams;
  @Input('virtualMapParams')
  set virtualMapParams(value: IVirtualMapParams) {
    this._virtualMapParams = value;
    this.updateForm(this._virtualMapParams);
  }
  get virtualMapParams(): IVirtualMapParams {
    return this._virtualMapParams;
  }

  private _miwcm: MapInfoWithColorMap;
  @Input('mapInfoWithColorMap')

  set mapInfoWithColorMap(value: MapInfoWithColorMap) {
    this._miwcm = value;

  }
  get mapInfoWithColorMap(): MapInfoWithColorMap {
    return this._miwcm;
  }

  @Input('isBuilding')
  set isBuilding(value: boolean) {
    let appButton = this.applyButton.nativeElement as HTMLButtonElement;
    if (value) {
      appButton.disabled = true;
    }
    else {
      appButton.disabled = false;
    }
  }

  @Output() mapInfoLoaded = new EventEmitter<MapInfoWithColorMap>();
  @Output() virtualMapParamsUpdated = new EventEmitter<IVirtualMapParams>();

  @ViewChild('applyButton') applyButton: ElementRef;
  @ViewChild('fileSelector') fileSelectorRef: ElementRef;

  constructor() {
    //let defaultScreenToPrintPixRat = this.getHomeScreenToPrintPixRat(defaultImageWidthPx, this.mapDisplayWidth);
    this._miwcm = new MapInfoWithColorMap(null, null);
    //this.displaySize = new CanvasSize(1000, 1000);

    this.mapViewForm = this.buildMainForm();
    //this.updateForm(this._virtualMapParams);
  }

  private buildMainForm(): FormGroup {

    let result = new FormGroup({
      imageWidthPx: new FormControl(21600),
      imageHeightPx: new FormControl(14400),

      imageWidth: new FormControl(72),
      imageHeigth: new FormControl(48),


      printDensity: new FormControl(300),
      zoomFactor: new FormControl(1),
      left: new FormControl(0),
      top: new FormControl(0),

      viewWidthPx: new FormControl(21600),
      viewHeightPx: new FormControl(14400),

      viewWidth: new FormControl(72),
      viewHeigth: new FormControl(48),

      screenToPrintPixRatio: new FormControl(24)
    });

    return result;
  }

  private updateForm(params: IVirtualMapParams): void {

    this.mapViewForm.controls.imageWidthPx.setValue(params.imageSize.width);
    this.mapViewForm.controls.imageHeightPx.setValue(params.imageSize.height);

    // Width of print output in inches.
    this.mapViewForm.controls.imageWidth.setValue(params.imageSizeInInches.width);

    // Number of print output pixels currently displayed.
    this.mapViewForm.controls.viewWidthPx.setValue(params.viewSize.width);
    this.mapViewForm.controls.viewHeightPx.setValue(params.viewSize.height);

    // Number of print output inches currently displayed.
    this.mapViewForm.controls.viewWidth.setValue(params.viewSizeInInches.width);

    this.mapViewForm.controls.screenToPrintPixRatio.setValue(params.scrToPrnPixRat);


    let zoomFactor = params.imageSize.width / params.viewSize.width;
    this.mapViewForm.controls.zoomFactor.setValue(zoomFactor);

    //let maxZoomFactor = this.getMaxZoomFactor(imageWidthPx, this.displaySize.width);
    //console.log('User pressed apply. The zoom factor is ' + zoomFactor + ' max zf is ' + maxZoomFactor + ' cw: ' + this.displaySize.width + ' ch: ' + this.displaySize.height + '.');
  }

  private getMapInfo(frm: FormGroup): IMapInfo {
    let result: IMapInfo;
    return result;
  }

  onSubmit() {

    let imageSize = new CanvasSize(
      this.mapViewForm.controls.imageWidthPx.value,
      this.mapViewForm.controls.imageHeightPx.value);

    let printDensity = this.mapViewForm.controls.printDensity.value;

    let screenToPrintPixRat = parseInt(this.mapViewForm.controls.screenToPrintPixRatio.value);

    let params = new VirtualMapParams(imageSize, printDensity, screenToPrintPixRat);

    this.virtualMapParamsUpdated.emit(params);
  }

  private getMaxZoomFactor(imageWidth: number, canvasWidth: number): number {
    let result = imageWidth / canvasWidth;
    return result;
  }

  onMoveL(evt: KeyboardEvent) {
    let amount: number = evt.shiftKey ? 50 : evt.ctrlKey ? 5 : 20;
    this.moveMap('l', amount);
  }

  onMoveR(evt: KeyboardEvent) {
    let amount: number = evt.shiftKey ? 50 : evt.ctrlKey ? 5 : 20;
    this.moveMap('r', amount);
  }

  onMoveU(evt: KeyboardEvent) {
    let amount: number = evt.shiftKey ? 50 : evt.ctrlKey ? 5 : 20;
    this.moveMap('u', amount);
  }

  onMoveD(evt: KeyboardEvent) {
    let amount: number = evt.shiftKey ? 50 : evt.ctrlKey ? 5 : 20;
    this.moveMap('d', amount);
  }

  private moveMap(dir: string, percent: number) {
    let newCoords: IBox;

    let mi = this.mapInfoWithColorMap.mapInfo;

    if (dir === 'o') {
      newCoords = mi.coords.getExpandedBox(percent);
    }
    else {
      newCoords = mi.coords.getShiftedBox(dir, percent);
    }

    let newMapInfo = new MapInfo(newCoords, mi.maxIterations, mi.iterationsPerStep);
    //this.raiseMapInfoUpdated(newMapInfo);
  }

  onGoBack() {
    alert('User pressed go back.');
    //this.goBack.emit(1);
  }

  onReset() {
    alert('User pressed Reset.');
    //this.goBack.emit(-1);
  }

  onLoadMapInfo() {
    let fSelector = this.fileSelectorRef.nativeElement as HTMLInputElement;

    let files: FileList = fSelector.files;

    console.log('The user selected these files: ' + files + '.');
    if (files.length <= 0) {
      return;
    }

    let fr = new FileReader();
    fr.onload = (ev => {
      let rawResult: string = fr.result as string;
      let miwcmfe: MapInfoWithColorMapForExport = JSON.parse(rawResult) as MapInfoWithColorMapForExport;
      let miwcm = MapInfoWithColorMap.fromForExport(miwcmfe, -1);
      this.mapInfoLoaded.emit(miwcm);
    });

    fr.readAsText(files.item(0));
  }

}
