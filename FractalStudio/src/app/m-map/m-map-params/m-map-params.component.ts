import { Component, EventEmitter, Output, Input, ViewChild, ElementRef } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

import {
  IPoint, Point, IBox, Box, IMapInfo, MapInfo,
  ColorMapUI, ColorMapForExport, MapInfoWithColorMap, MapInfoWithColorMapForExport
} from '../m-map-common';

@Component({
  selector: 'app-m-map-params',
  templateUrl: './m-map-params.component.html',
  styleUrls: ['./m-map-params.component.css']
})
export class MMapParamsComponent {
  //@Output() colorMapUpdated = new EventEmitter<ColorMapUI>();

  @Output() mapInfoUpdated = new EventEmitter<IMapInfo>();
  @Output() mapInfoLoaded = new EventEmitter<MapInfoWithColorMap>();
  @Output() goBack = new EventEmitter<number>();

  private _miwcm: MapInfoWithColorMap;
  @Input('mapInfoWithColorMap')

  set mapInfoWithColorMap(value: MapInfoWithColorMap) {
    this._miwcm = value;
    this.updateForm(this._miwcm.mapInfo);
  }
  get mapInfoWithColorMap(): MapInfoWithColorMap {
    return this._miwcm;
  }

  //private _mapInfo: IMapInfo;

  //@Input('mapInfo')
  //set mapInfo(value: IMapInfo) {
  //  this._mapInfo = value;
  //  this.updateForm(this._mapInfo);
  //}

  //get mapInfo(): IMapInfo {
  //  return this._mapInfo;
  //}


  //@Input('colorMap') colorMap: ColorMapUI;

  @ViewChild('download') downloadRef: ElementRef;
  @ViewChild('fileSelector') fileSelectorRef: ElementRef;

  mapCoordsForm = new FormGroup({
    startX: new FormControl(),
    endX: new FormControl(),
    startY: new FormControl(),
    endY: new FormControl(),
    maxIterations: new FormControl(),
    iterationsPerStep: new FormControl()
  });

  constructor() { }

  private updateForm(mapInfo: IMapInfo): void {
    this.mapCoordsForm.controls["startX"].setValue(mapInfo.coords.botLeft.x);
    this.mapCoordsForm.controls["endX"].setValue(mapInfo.coords.topRight.x);
    this.mapCoordsForm.controls["startY"].setValue(mapInfo.coords.botLeft.y);
    this.mapCoordsForm.controls["endY"].setValue(mapInfo.coords.topRight.y);

    this.mapCoordsForm.controls["maxIterations"].setValue(mapInfo.maxIterations);
    this.mapCoordsForm.controls["iterationsPerStep"].setValue(mapInfo.iterationsPerStep);
  }

  private getMapInfo(frm: FormGroup): IMapInfo {
    let result: IMapInfo;

    let botLeft: IPoint = Point.fromStringVals(frm.controls["startX"].value, frm.controls["startY"].value);
    let topRight: IPoint = Point.fromStringVals(frm.controls["endX"].value, frm.controls["endY"].value);

    let coords: IBox = new Box(botLeft, topRight);

    let maxIterations = parseInt(frm.controls["maxIterations"].value);
    let iterationsPerStep = parseInt(frm.controls["iterationsPerStep"].value);

    // TODO: consider creating a field on our form to store the upsideDownValue.
    // for rigth now, we know that the MapInfo we use in the UI is always right side up.
    result = new MapInfo(coords, maxIterations, iterationsPerStep, false);

    return result;
  }

  //ngOnChanges() {
  //  console.log('Params is handling ngOnChanges.'); // and is pushing the new MapInfo on the stack. The stack now has ' + this.history.length + ' items.');
  //  this.updateForm(this.mapInfo);
  //}

  onSubmit() {
    //console.warn(this.mapCoordsForm.value);
    let mapInfo: IMapInfo = this.getMapInfo(this.mapCoordsForm);
    console.log('Params is handling form submit.'); // The stack now has ' + this.history.length + ' items.');

    this.mapInfoUpdated.emit(mapInfo);
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

  onZoomOut(evt: KeyboardEvent) {
    let amount: number = evt.shiftKey ? 50 : evt.ctrlKey ? 5 : 20;
    this.moveMap('o', amount);
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

    let newMapInfo = new MapInfo(newCoords, mi.maxIterations, mi.iterationsPerStep, mi.upsideDown);
    this.mapInfoUpdated.emit(newMapInfo);
  }

  onGoBack() {
    this.goBack.emit(1);
  }

  onReset() {
    this.goBack.emit(-1);
  }

  onSaveMapInfo() {
    let colorMapForExport: ColorMapForExport = ColorMapForExport.FromColorMap(this.mapInfoWithColorMap.colorMapUi);
    let mapInfo = this.getMapInfo(this.mapCoordsForm);
    let miwcmfe = new MapInfoWithColorMapForExport(mapInfo, colorMapForExport);

    let dump: string = JSON.stringify(miwcmfe, null, 2);
    let dataUri = "data:text/json;charset=utf-8," + encodeURIComponent(dump);

    let a = this.downloadRef.nativeElement as HTMLAnchorElement;
    a.download = "MandlebrodtMapInfo.json";
    a.href = dataUri;
    a.click();
    //a.hidden = false;

    console.log('The MapInfoWithColorMap is |' + dump + '|');
  }

  onLoadMapInfo() {
    //alert('m-map-params onLoadMapInfo called.');
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

  onTest() {
    this.goBack.emit(2);
  }

}
