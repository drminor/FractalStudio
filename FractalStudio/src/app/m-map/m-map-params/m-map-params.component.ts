import { Component, OnInit, EventEmitter, Output, Input, ViewChild, ElementRef } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

import { IPoint, Point, IMapInfo, MapInfo, ColorMap, ColorMapEntry, IBox, Box, ColorMapUI, IColorMap, ColorMapForExport, MapInfoWithColorMap} from '../m-map-common';

@Component({
  selector: 'app-m-map-params',
  templateUrl: './m-map-params.component.html',
  styleUrls: ['./m-map-params.component.css']
})
export class MMapParamsComponent implements OnInit {
  @Output() mapInfoUpdated = new EventEmitter<IMapInfo>();
  @Output() colorMapUpdated = new EventEmitter<IColorMap>();

  @Output() goBack = new EventEmitter<number>();
  @Output() mapInfoLoaded = new EventEmitter<MapInfoWithColorMap>();

  @Input('mapInfo') mapInfo: IMapInfo;
  @Input('colorMap') colorMap: ColorMapUI;

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
    this.mapCoordsForm.controls["startX"].setValue(mapInfo.coords.start.x);
    this.mapCoordsForm.controls["endX"].setValue(mapInfo.coords.end.x);
    this.mapCoordsForm.controls["startY"].setValue(mapInfo.coords.start.y);
    this.mapCoordsForm.controls["endY"].setValue(mapInfo.coords.end.y);

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

  ngOnChanges() {
    console.log('Params is handling ngOnChanges.'); // and is pushing the new MapInfo on the stack. The stack now has ' + this.history.length + ' items.');
    this.updateForm(this.mapInfo);
  }

  onSubmit() {
    //console.warn(this.mapCoordsForm.value);
    let mapInfo: IMapInfo = this.getMapInfo(this.mapCoordsForm);
    console.log('Params is handling form submit.'); // The stack now has ' + this.history.length + ' items.');

    this.mapInfoUpdated.emit(mapInfo);
  }

  onGoBack() {
    this.goBack.emit(1);
  }

  onReset() {
    this.goBack.emit(-1);
  }

  onSaveMapInfo() {
    let colorMapForExport: ColorMapForExport = ColorMapForExport.FromColorMap(this.colorMap);
    let mapInfo = this.getMapInfo(this.mapCoordsForm);
    let miWithcm = new MapInfoWithColorMap(mapInfo, colorMapForExport);

    let dump: string = JSON.stringify(miWithcm, null, 2);
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
      let miwcm: MapInfoWithColorMap = JSON.parse(rawResult) as MapInfoWithColorMap;

      this.mapInfoLoaded.emit(miwcm);
      //let mapInfo = MapInfo.fromIMapInfo(miwcm.mapInfo);
      //console.log('Just loaded MapInfo with value = ' + mapInfo + '.');
      //this.mapInfoUpdated.emit(mapInfo);

      //let colorMap: IColorMap = ColorMapUI.FromColorMapForExport(miwcm.colorMap);
      //this.colorMapUpdated.emit(colorMap);

      //// clear the history
      //this.goBack.emit(-2);
    });

    fr.readAsText(files.item(0));

  }

  onTest() {
    this.goBack.emit(2);
  }

  ngOnInit() {
  }

}
