import { Component, OnInit, EventEmitter, Output, Input } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

import { IPoint, Point, IMapInfo, MapInfo, ColorMap, ColorMapEntry, IBox, Box} from '../m-map-common';

@Component({
  selector: 'app-m-map-params',
  templateUrl: './m-map-params.component.html',
  styleUrls: ['./m-map-params.component.css']
})
export class MMapParamsComponent implements OnInit {
  @Output() mapInfoUpdated = new EventEmitter<IMapInfo>();
  @Output() goBack = new EventEmitter<number>();

  @Input('mapInfo') mapInfo: IMapInfo;

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
    console.warn(this.mapCoordsForm.value);
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

  onTest() {
    this.goBack.emit(2);
  }

  onDownloadImage(): void {
    //window.location = canvas.toDataURL('image/png');
  }

  ngOnInit() {
  }


}
