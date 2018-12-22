import { Component, EventEmitter, Output, Input, ViewChild, ElementRef, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

import {
  IPoint, Point, IBox, Box, IMapInfo, MapInfo,
  ColorMapForExport, MapInfoWithColorMap, MapInfoWithColorMapForExport
} from '../m-map-common';

@Component({
  selector: 'app-m-map-designer-params',
  templateUrl: './m-map-designer-params.component.html',
  styleUrls: ['./m-map-designer-params.component.css']
})
export class MMapDesignerParamsComponent implements OnInit {

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

  @ViewChild('applyButton') applyButton: ElementRef;
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
    result = new MapInfo(coords, maxIterations, iterationsPerStep);

    return result;
  }

  onSubmit() {
    let mapInfo: IMapInfo = this.getMapInfo(this.mapCoordsForm);
    if (mapInfo.isEqual(this.mapInfoWithColorMap.mapInfo)) {
      console.log('Params is handling form submit. No changes -- ignoring.');
    }
    else {
      console.log('Params is handling form submit with changes.');
      this.raiseMapInfoUpdated(mapInfo);
    }
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

    let newMapInfo = new MapInfo(newCoords, mi.maxIterations, mi.iterationsPerStep);
    this.raiseMapInfoUpdated(newMapInfo);
  }

  private raiseMapInfoUpdated(mapInfo: IMapInfo): void {
    this.mapInfoUpdated.emit(mapInfo);
  }

  onGoBack() {
    this.goBack.emit(1);
  }

  onReset() {
    this.goBack.emit(-1);
  }

  onSaveMapInfo() {
    let colorMapForExport = ColorMapForExport.FromColorMap(this.mapInfoWithColorMap.colorMapUi);
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

  ngOnInit(): void {
    let fSelector = this.fileSelectorRef.nativeElement as HTMLInputElement;
    fSelector.onchange = (evd => {
      this.onLoadMapInfo();
    });
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
