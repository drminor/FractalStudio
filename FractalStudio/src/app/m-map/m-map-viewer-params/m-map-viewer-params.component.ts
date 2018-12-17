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

  @Input('mapDisplayWidth') mapDisplayWidth: number;
  @Input('mapDisplayHeight') mapDisplayHeight: number;


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

    let defaultPrintWidth = 21600;
    let defaultPrintDensity = 300;
    let displayWidth = defaultPrintWidth / defaultPrintDensity;

    let result = new FormGroup({
      printWidth: new FormControl(defaultPrintWidth),
      printDensity: new FormControl(defaultPrintDensity),
      zoomFactor: new FormControl('1'),
      left: new FormControl('0'),
      top: new FormControl('0'),
      displayWidth: new FormControl(displayWidth)
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
    alert('User pressed apply. The zoom factor is ' + zoomFactor + ' cw: ' + this.mapDisplayWidth + ' ch: ' + this.mapDisplayHeight + '.');

    let printWidth = this.mapViewForm.controls.printWidth.value;
    let printDensity = this.mapViewForm.controls.printDensity.value;

    let displayWidthInPixels = printWidth / zoomFactor;
    let displayWidthInInches = displayWidthInPixels / printDensity;

    this.mapViewForm.controls.displayWidth.setValue(displayWidthInInches);
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
