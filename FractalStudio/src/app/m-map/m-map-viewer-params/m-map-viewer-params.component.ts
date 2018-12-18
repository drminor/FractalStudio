import { Component, EventEmitter, Output, Input, ViewChild, ElementRef } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

import { IBox,  IMapInfo, MapInfo, MapInfoWithColorMap, MapInfoWithColorMapForExport} from '../m-map-common';

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
    let imageWidthPx = this.mapViewForm.controls.imageWidthPx.value;
    let newScreenToPrintPixRatio = this.getHomeScreenToPrintPixRat(imageWidthPx, this.mapDisplayWidth);
    this.mapViewForm.controls.screenToPrintPixRatio.setValue(newScreenToPrintPixRatio);
    this.updateForm();
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

  private curViewMapInfo: IMapInfo;

  @ViewChild('applyButton') applyButton: ElementRef;
  @ViewChild('fileSelector') fileSelectorRef: ElementRef;


  public mapViewForm: FormGroup;

  constructor() {

    this.mapViewForm = this.buildMainForm();
    this.updateForm();

    this.curViewMapInfo = null;
  }

  private buildMainForm(): FormGroup {

    let defaultImageWidthPx = 21600; // Total number of pixels in print output.
    let defaultPrintDensity = 300; // Pixels per linear inch.
    //let imageWidth = defaultImageWidthPx / defaultPrintDensity;

    let defaultScreenToPrintPixRat = this.getHomeScreenToPrintPixRat(defaultImageWidthPx, this.mapDisplayWidth);

    //let viewWidthPx = this.mapDisplayWidth * defaultScreenToPrintPixRat;
    //let viewWidth = viewWidthPx / defaultPrintDensity;

    //let zoomFactor = defaultImageWidthPx / viewWidthPx;

    //let result = new FormGroup({
    //  imageWidthPx: new FormControl(defaultImageWidthPx),
    //  imageWidth: new FormControl(imageWidth),

    //  printDensity: new FormControl(defaultPrintDensity),
    //  zoomFactor: new FormControl(zoomFactor),
    //  left: new FormControl(0),
    //  top: new FormControl(0),

    //  viewWidthPx: new FormControl(viewWidthPx),
    //  viewWidth: new FormControl(viewWidth),

    //  screenToPrintPixRatio: new FormControl(defaultScreenToPrintPixRat)
    //});

    let result = new FormGroup({
      imageWidthPx: new FormControl(defaultImageWidthPx),
      imageWidth: new FormControl(''),

      printDensity: new FormControl(defaultPrintDensity),
      zoomFactor: new FormControl(''),
      left: new FormControl(0),
      top: new FormControl(0),

      viewWidthPx: new FormControl(''),
      viewWidth: new FormControl(''),

      screenToPrintPixRatio: new FormControl(defaultScreenToPrintPixRat)
    });

    return result;
  }

  private updateForm(): void {
    let imageWidthPx = this.mapViewForm.controls.imageWidthPx.value;
    let printDensity = this.mapViewForm.controls.printDensity.value;

    // Print Output in inches
    let imageWidth = imageWidthPx / printDensity;
    this.mapViewForm.controls.imageWidth.setValue(imageWidth);

    let screenToPrintPixRat = this.mapViewForm.controls.screenToPrintPixRatio.value;

    // Number of print output pixels currently displayed.
    let viewWidthPx = this.mapDisplayWidth * screenToPrintPixRat;
    this.mapViewForm.controls.viewWidthPx.setValue(viewWidthPx);

    // Number of print output inches currently displayed.
    let viewWidth = viewWidthPx / printDensity;
    this.mapViewForm.controls.viewWidth.setValue(viewWidth);

    let zoomFactor = imageWidthPx / viewWidthPx;
    this.mapViewForm.controls.zoomFactor.setValue(zoomFactor);

    let maxZoomFactor = this.getMaxZoomFactor(imageWidthPx, this.mapDisplayWidth);
    console.log('User pressed apply. The zoom factor is ' + zoomFactor + ' max zf is ' + maxZoomFactor + ' cw: ' + this.mapDisplayWidth + ' ch: ' + this.mapDisplayHeight + '.');

  }

  private getMapInfo(frm: FormGroup): IMapInfo {
    let result: IMapInfo;
    return result;
  }

  onSubmit() {
    let imageWidthPx = this.mapViewForm.controls.imageWidthPx.value;
    let defaultScreenToPrintPixRat = this.getHomeScreenToPrintPixRat(imageWidthPx, this.mapDisplayWidth);

    // TODO: validate this input -- should be a positive integer.
    let screenToPrintPixRat = parseInt(this.mapViewForm.controls.screenToPrintPixRatio.value);

    if (screenToPrintPixRat < 0 || screenToPrintPixRat > defaultScreenToPrintPixRat) {
      alert('Invalid Screen to Print Pixel ratio, using ' + defaultScreenToPrintPixRat + '.');
      screenToPrintPixRat = defaultScreenToPrintPixRat;
    }

    this.mapViewForm.controls.screenToPrintPixRatio.setValue(screenToPrintPixRat);

    this.updateForm();
  }

  private getHomeScreenToPrintPixRat(imageWidthPx: number, canvasWidthPx: number): number {
    let screenToPrintRat = imageWidthPx / canvasWidthPx;

    // Truncate to the nearest integer
    let result = parseInt((screenToPrintRat).toString());
    return result;
  }

  //private getScreenToPrintPixRat(imageWidthPx: number, canvasWidthPx: number, zoomFactor: number): number {

  //  let screenToPrintRat = imageWidthPx / canvasWidthPx;
  //  let result = screenToPrintRat / zoomFactor;

  //  return result;
  //}

  //private getViewWidth(imageWidth: number, zoomFactor: number): number {
  //  let result = imageWidth / zoomFactor;
  //  return result;
  //}

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
