import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, Input } from '@angular/core';
import { Logger } from '../../logger.service';

import {
  IPoint, Point, ICanvasSize, CanvasSize,
  IMapInfo, MapInfo, IMapWorkingData, MapWorkingData
} from '../m-map-common';

import { MMapService } from '../m-map.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-m-map-display',
  templateUrl: './m-map.display.component.html',
  styleUrls: ['./m-map.display.component.css']
  //,
  //inputs: ['canvasWidth', 'canvasHeight']
})
export class MMapDisplayComponent implements AfterViewInit, OnInit {

  @Input('canvas-width') canvasWidth: number;
  @Input('canvas-height') canvasHeight: number;

  @ViewChild('myCanvas') canvasRef: ElementRef;

  public alive: boolean;

  private viewInitialized: boolean;
  private canvasSize: ICanvasSize;
  private workingData: IMapWorkingData;
  private tot: string = 'default';

  constructor(private logger: Logger, private mService: MMapService) {
    this.viewInitialized = false;

    this.workingData = null;

    //var flags: boolean[] = MapWorkingData.getFlagData(result);
    //this.rLen = flags.length;
  }

  doInterations(iterCount: number): void {
    this.alive = this.workingData.doInterationsForAll(iterCount);
  }

  draw(): void {
    let ctx: CanvasRenderingContext2D = this.canvasRef.nativeElement.getContext('2d');

    var w: number = this.canvasRef.nativeElement.width;
    var h: number = this.canvasRef.nativeElement.height;

    console.log("Drawing on canvas with W = " + w + " H = " + h);

    ctx.fillStyle = '#DD0031';
    ctx.clearRect(0, 0, this.canvasSize.width, this.canvasSize.height);

    console.log("Got ctx.");

    //let imgData: ImageData = ctx.getImageData(0, 0, this.canvasSize.width, this.canvasSize.height);
    //console.log("Got image data.");

    //this.workingData.updateImageData(imgData);
    //console.log("Updated buffer data.");

    let imgData:ImageData = this.workingData.getImageData();

    ctx.putImageData(imgData, 0, 0);
    console.log("Updated canvas.");
  }

  ngOnInit(): void {
    console.log("We are inited.");
  }

  ngOnChanges() {
    if (this.viewInitialized) {
      console.log("m-map-display.component is handling ngOnChanges -- the view has NOT been initialized.");
      this.doInterations(1);
      this.draw();
    }
    else {
      console.log("m-map-display.component is handling ngOnChanges -- the view has been initialized.");
    }
  }

  ngAfterViewInit() {
    if (!this.viewInitialized) {

      console.log("Initializing the canvas size and building the Map Working Data here once because we are finally ready.");

      this.canvasSize = this.initMapDisplay();

      console.log("W = " + this.canvasSize.width + " H = " + this.canvasSize.height);

      this.workingData = this.buildWorkingData(this.canvasSize);

      this.viewInitialized = true;

      this.progresslvy();
    }
  }

  private initMapDisplay(): ICanvasSize {

    // Set our canvas size = to the number of pixels actually used to display our canvas HTML element.
    const result: ICanvasSize = new CanvasSize(
      this.canvasRef.nativeElement.offsetWidth,
      this.canvasRef.nativeElement.offsetHeight
    );

    // Set the internal canvas's bitmap equal to the pixels on the screen. (Zoom = 1)
    this.canvasRef.nativeElement.width = result.width;
    this.canvasRef.nativeElement.height = result.height;

    return result;
  }

  private buildWorkingData(canvasSize: ICanvasSize): IMapWorkingData {

    const topRight: IPoint = new Point(1, 1);
    const bottomLeft: IPoint = new Point(-2, -1);

    const maxInterations = 1000;

    const mi: IMapInfo = new MapInfo(bottomLeft, topRight, maxInterations);

    const workingData = this.mService.createMapWD(canvasSize, mi);

    return workingData;
  }

  private progresslvy(): void {

    const that = this;

    let iterCount = 100;
    const intId = setInterval(doOneAndDraw, 100);

    function doOneAndDraw() {
      if (iterCount > 0) {
        iterCount--;
        that.doInterations(1);
        that.draw();
      } else {
        clearInterval(intId);
      }
    }
  }

  myObservable = Observable.create(function (observer) {
    observer.next('1');
    observer.next('2');
    observer.next('3');
  });

  displayResult() {
      this.myObservable.subscribe(tot => this.tot = tot);
  }


}
