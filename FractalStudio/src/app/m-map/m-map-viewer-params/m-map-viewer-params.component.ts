import { Component, EventEmitter, Output, Input, ViewChild, ElementRef } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

import {
  IPoint, Point, IBox, Box, IMapInfo, MapInfo,
  ColorMapForExport, MapInfoWithColorMap, MapInfoWithColorMapForExport
} from '../m-map-common';
import { CanvasSize } from 'bin/Debug/netcoreapp2.1/src/app/m-map/m-map-common';

@Component({
  selector: 'app-m-map-viewer-params',
  templateUrl: './m-map-viewer-params.component.html',
  styleUrls: ['./m-map-viewer-params.component.css']
})
export class MMapViewerParamsComponent {

  @Output() mapInfoUpdated = new EventEmitter<IMapInfo>();
  @Output() mapInfoLoaded = new EventEmitter<MapInfoWithColorMap>();
  @Output() goBack = new EventEmitter<number>();

  private mapDisplayWidth: number = 1000;
  @Input('mapDisplayWidth')
  set mapDisplayWidthPx(value: string) {
    this.mapDisplayWidth = parseInt(value.substring(0, value.length - 2));
  }

  private mapDisplayHeight: number = 1000;
  @Input('mapDisplayHeight') 
  set mapDisplayHeightPx(value: string) {
    this.mapDisplayHeight = parseInt(value.substring(0, value.length - 2));
  }

  private _miwcm: MapInfoWithColorMap;
  @Input('mapInfoWithColorMap')

  set mapInfoWithColorMap(value: MapInfoWithColorMap) {
    this._miwcm = value;
    if (this.curViewMapInfo === null) {
      this.curViewMapInfo = value.mapInfo;
    }
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

  private canvasSize = new CanvasSize(21600, 14400);

  private curViewMapInfo: IMapInfo;

  @ViewChild('applyButton') applyButton: ElementRef;
  @ViewChild('fileSelector') fileSelectorRef: ElementRef;


  public mapViewForm: FormGroup;

  constructor() {

    this.mapViewForm = this.buildMainForm();
    this.curViewMapInfo = null;
  }

  private buildMainForm(): FormGroup {

    let defaultImageWidthPx = 21600; // Total number of pixels in print output.
    let defaultPrintDensity = 300; // Pixels per linear inch.

    let defaultScreenTopPrintPixRat = this.getHomeScreenToPrintPixRat(defaultImageWidthPx, this.mapDisplayWidth);

    let defaultZoomFactor = 1;

    let imageWidth = defaultImageWidthPx / defaultPrintDensity;

    let viewWidthPx = this.getViewWidth(defaultImageWidthPx, defaultZoomFactor);
    let viewWidth = this.getViewWidth(imageWidth, defaultZoomFactor);

    let screenToPrintPixRat = this.getScreenToPrintPixRat(defaultImageWidthPx, this.mapDisplayWidth, defaultZoomFactor);

    let result = new FormGroup({
      imageWidthPx: new FormControl(defaultImageWidthPx),
      imageWidth: new FormControl(imageWidth),

      printDensity: new FormControl(defaultPrintDensity),
      zoomFactor: new FormControl(defaultZoomFactor),
      left: new FormControl(0),
      top: new FormControl(0),

      viewWidthPx: new FormControl(viewWidthPx),
      viewWidth: new FormControl(viewWidth),

      screenToPrintPixRatio: new FormControl(screenToPrintPixRat)
    });

    return result;
  }

  private updateForm(mapInfo: IMapInfo): void {
  }

  private getMapInfo(frm: FormGroup): IMapInfo {
    let result: IMapInfo;
    return result;
  }

  onSubmit() {
    let zoomFactor = this.mapViewForm.controls.zoomFactor.value;

    let imageWidthPx = this.mapViewForm.controls.imageWidthPx.value;
    let printDensity = this.mapViewForm.controls.printDensity.value;

    // Print Output in inches
    let imageWidth = imageWidthPx / printDensity;
    this.mapViewForm.controls.imageWidth.setValue(imageWidth);

    // Number of print output pixels currently displayed.
    let viewWidthPx = this.getViewWidth(imageWidthPx, zoomFactor);
    this.mapViewForm.controls.viewWidthPx.setValue(viewWidthPx);

    // Number of print output inches currently displayed.
    let viewWidth = this.getViewWidth(imageWidth, zoomFactor);
    this.mapViewForm.controls.viewWidth.setValue(viewWidth);

    let screenToPrintPixRat = this.getScreenToPrintPixRat(imageWidthPx, this.mapDisplayWidth, zoomFactor);
    this.mapViewForm.controls.screenToPrintPixRatio.setValue(screenToPrintPixRat);

    let maxZoomFactor = this.getMaxZoomFactor(imageWidthPx, this.mapDisplayWidth);
    console.log('User pressed apply. The zoom factor is ' + zoomFactor + ' max zf is ' + maxZoomFactor + ' cw: ' + this.mapDisplayWidth + ' ch: ' + this.mapDisplayHeight + '.');
  }

  private getHomeScreenToPrintPixRat(imageWidthPx: number, canvasWidthPx: number): number {
    let screenToPrintRat = imageWidthPx / canvasWidthPx;

    // Round up to the nearest integer
    let result = parseInt((screenToPrintRat + 1).toString());
    return result;
  }

  private getScreenToPrintPixRat(imageWidthPx: number, canvasWidthPx: number, zoomFactor: number): number {

    let screenToPrintRat = imageWidthPx / canvasWidthPx;
    let result = screenToPrintRat / zoomFactor;

    return result;
  }

  private getViewWidth(imageWidth: number, zoomFactor: number): number {
    let result = imageWidth / zoomFactor;
    return result;
  }

  private getMaxZoomFactor(imageWidth: number, canvasWidth: number): number {

    //let canvasWidthInInches = canvasWidth / displayDensity;

    //let printWidthInInches = imageWidth / printDensity;

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
    this.raiseMapInfoUpdated(newMapInfo);
  }

  private raiseMapInfoUpdated(mapInfo: IMapInfo): void {
    this.mapInfoUpdated.emit(mapInfo);
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
