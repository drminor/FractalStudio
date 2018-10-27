import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

import { IPoint, Point, ICanvasSize, CanvasSize, IMapInfo, MapInfo, ColorMap, ColorMapEntry} from '../m-map-common';

@Component({
  selector: 'app-m-map-params',
  templateUrl: './m-map-params.component.html',
  styleUrls: ['./m-map-params.component.css']
})
export class MMapParamsComponent implements OnInit {
  @Output() mapInfoUpdated = new EventEmitter<IMapInfo>();

  mapCoordsForm = new FormGroup({
    startX: new FormControl('-2'),
    endX: new FormControl('1'),
    startY: new FormControl('-1'),
    endY: new FormControl('1'),
    maxIterations: new FormControl('500'),
    iterationsPerStep: new FormControl('10')
  });

  constructor() {
    //this.mapCoordsForm.controls["startX"].setValue('-7');
  }

  private getMapInfo(coords: FormGroup): IMapInfo {
    let result: IMapInfo;

    let botLeft: IPoint = this.getPoint(coords.controls["startX"].value, coords.controls["startY"].value);
    let topRight: IPoint = this.getPoint(coords.controls["endX"].value, coords.controls["endY"].value);

    let maxIterations = parseInt(coords.controls["maxIterations"].value);
    let iterationsPerStep = parseInt(coords.controls["iterationsPerStep"].value);

    result = new MapInfo(botLeft, topRight, maxIterations, iterationsPerStep);

    return result;
  }

  private getPoint(x: string, y: string): IPoint {
    let xNum = parseFloat(x);
    let yNum = parseFloat(y);
    let result: IPoint = new Point(xNum, yNum);

    return result;
  }

  onSubmit() {
    console.warn(this.mapCoordsForm.value);
    let mapInfo: IMapInfo = this.getMapInfo(this.mapCoordsForm);
    this.mapInfoUpdated.emit(mapInfo);
  }

  onDownloadImage(): void {
    //window.location = canvas.toDataURL('image/png');
  }





  ngOnInit() {
  }

  

}
