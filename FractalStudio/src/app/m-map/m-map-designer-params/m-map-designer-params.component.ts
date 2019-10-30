import { Component, EventEmitter, Output, Input, ViewChild, ElementRef, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

import { IMapInfo, MapInfo, SPoint, SCoords, MapInfoForExport, IMapInfoForExport } from '../m-map-common';

import { ColorMapForExport, MapInfoWithColorMap, MapInfoWithColorMapForExport } from '../m-map-common-ui';


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
    jobName: new FormControl(),
    startX: new FormControl(),
    endX: new FormControl(),
    startY: new FormControl(),
    endY: new FormControl(),
    maxIterations: new FormControl(),
    threshold: new FormControl(),
    //iterationsPerStep: new FormControl()
  });

  constructor() { }

  private updateForm(mapInfo: IMapInfo): void {
    this.mapCoordsForm.controls["jobName"].setValue(mapInfo.name);

    this.mapCoordsForm.controls["startX"].setValue(mapInfo.sCoords.botLeft.x);
    this.mapCoordsForm.controls["endX"].setValue(mapInfo.sCoords.topRight.x);
    this.mapCoordsForm.controls["startY"].setValue(mapInfo.sCoords.botLeft.y);
    this.mapCoordsForm.controls["endY"].setValue(mapInfo.sCoords.topRight.y);

    this.mapCoordsForm.controls["maxIterations"].setValue(mapInfo.maxIterations);
    this.mapCoordsForm.controls.threshold.setValue(mapInfo.threshold);

    //this.mapCoordsForm.controls["iterationsPerStep"].setValue(mapInfo.iterationsPerStep);
  }

  private getMapInfo(frm: FormGroup): IMapInfo {
    let result: IMapInfo;

    let name = frm.controls["jobName"].value;

    let botLeft = new SPoint(frm.controls["startX"].value, frm.controls["startY"].value);
    let topRight = new SPoint(frm.controls["endX"].value, frm.controls["endY"].value);
    let coords = new SCoords(botLeft, topRight);

    let maxIterations = parseInt(frm.controls["maxIterations"].value);
    let threshold = parseInt(frm.controls.threshold.value);

    //let iterationsPerStep = parseInt(frm.controls["iterationsPerStep"].value);
    let iterationsPerStep = 100;

    result = new MapInfo(name, coords, maxIterations, threshold, iterationsPerStep);

    return result;
  }

  onSubmit() {
    let mapInfo: IMapInfo = this.getMapInfo(this.mapCoordsForm);
    if (mapInfo.isEqual(this.mapInfoWithColorMap.mapInfo)) {
      console.log('Params is handling form submit. No changes -- ignoring.');
    }
    else {
      console.log('Params is handling form submit with changes.');
      this.mapInfoUpdated.emit(mapInfo);
    }
  }

  onMoveL(evt: KeyboardEvent) {
    this.moveMap('l', this.getPercentFromKeyState(evt));
  }

  onMoveR(evt: KeyboardEvent) {
    this.moveMap('r', this.getPercentFromKeyState(evt));
  }

  onMoveU(evt: KeyboardEvent) {
    this.moveMap('u', this.getPercentFromKeyState(evt));
  }

  onMoveD(evt: KeyboardEvent) {
    this.moveMap('d', this.getPercentFromKeyState(evt));
  }

  onZoomOut(evt: KeyboardEvent) {
    this.moveMap('o', this.getPercentFromKeyState(evt));
  }

  private getPercentFromKeyState(evt: KeyboardEvent): number {
    let result: number = evt.shiftKey ? 50 : evt.ctrlKey ? 5 : 20;
    return result;
  }

  private moveMap(dir: string, percent: number) {
    let newCoords: SCoords;

    let mi = this.mapInfoWithColorMap.mapInfo;

    if (dir === 'o') {
      newCoords = this.getZoomOutCoords(mi.sCoords, percent);
    }
    else {
      newCoords = this.getShiftedCoords(mi.sCoords, dir, percent);
    }

    let newMapInfo = new MapInfo(mi.name, newCoords, mi.maxIterations, mi.threshold, mi.iterationsPerStep);

    this.mapInfoUpdated.emit(newMapInfo);
  }

  private getZoomOutCoords(curCoords: SCoords, percent: number): SCoords {
    let result: SCoords = new SCoords(curCoords.botLeft, curCoords.topRight);
    return result;
  }

  private getShiftedCoords(curCoords: SCoords, dir: string, percent: number): SCoords {
    let result: SCoords = new SCoords(curCoords.botLeft, curCoords.topRight);
    return result;
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
    let mife: IMapInfoForExport = MapInfoForExport.fromMapInfo(mapInfo);
    let miwcmfe = new MapInfoWithColorMapForExport(mife, colorMapForExport);

    let dump: string = JSON.stringify(miwcmfe, null, 2);
    let dataUri = "data:text/json;charset=utf-8," + encodeURIComponent(dump);

    let a = this.downloadRef.nativeElement as HTMLAnchorElement;
    a.download = mapInfo.name + ".json"; // "MandlebrodtMapInfo.json";
    a.href = dataUri;
    a.click();

    console.log('The MapInfoWithColorMap is |' + dump + '|');
  }

  ngOnInit(): void {
    let fSelector = this.fileSelectorRef.nativeElement as HTMLInputElement;
    fSelector.onchange = (evd => {
      this.onLoadMapInfo();
    });
  }

  onLoadMapInfo() {
    let selectedFile = this.getSelectedFile();

    if (selectedFile === null) return;

    let fr = new FileReader();
    fr.onload = (ev => {
      let fn: string = this.removeFileExt(this.getSelectedFile().name);
      console.log('Loading file with name = ' + fn + '.');
      let rawResult: string = fr.result as string;
      let miwcmfe: MapInfoWithColorMapForExport = JSON.parse(rawResult) as MapInfoWithColorMapForExport;
      let miwcm = MapInfoWithColorMap.fromForExport(miwcmfe, -1, fn);
      //console.log('Loading color map, the highcolor is ' + miwcm.colorMapUi.highColorCss + '.');
      this.clearSelectedFile();
      this.mapInfoLoaded.emit(miwcm);
    });

    fr.readAsText(selectedFile);
  }

  private getSelectedFile(): File {
    let fSelector = this.fileSelectorRef.nativeElement as HTMLInputElement;

    let files: FileList = fSelector.files;

    console.log('The user selected these files: ' + files + '.');
    if (files.length <= 0) {
      return null;
    }

    let x: File = files.item(0);
    return x;
  }

  private clearSelectedFile() {
    let fSelector = this.fileSelectorRef.nativeElement as HTMLInputElement;
    fSelector.value = '';
  }

  private removeFileExt(fn: string): string {
    let pos = fn.lastIndexOf('.');

    if (pos > 0) {
      return fn.slice(0, pos);
    }
    else {
      return fn;
    }
  }


}
