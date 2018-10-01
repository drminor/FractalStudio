import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, Input } from '@angular/core';
import { Logger } from '../../logger.service';

import {
  IPoint, Point, ICanvasSize, CanvasSize,
  IMapInfo, MapInfo, IMapWorkingData, MapWorkingData,
  IWebWorkerMapUpdateResponse, WebWorkerMapUpdateResponse, WebWorkerMessage, IWebWorkerMessage, WebWorkerStartRequest
} from '../m-map-common';

import { MMapService } from '../m-map.service';

@Component({
  selector: 'app-m-map-display',
  templateUrl: './m-map.display.component.html',
  styleUrls: ['./m-map.display.component.css']
  //,
  //inputs: ['canvasWidth', 'canvasHeight']
})
export class MMapDisplayComponent implements AfterViewInit, OnInit {

  //@Input('canvas-width') canvasWidth: number;
  //@Input('canvas-height') canvasHeight: number;

  @ViewChild('myCanvas') canvasRef: ElementRef;

  public alive: boolean;

  private viewInitialized: boolean;
  private componentInitialized: boolean;
  private canvasSize: ICanvasSize;
  //private workingData: IMapWorkingData;

  private workers: Worker[];
  private curIterationCount: number;

  constructor(private logger: Logger, private mService: MMapService) {
    this.componentInitialized = false;
    this.viewInitialized = false;

    //this.workingData = null;
    this.workers = [];
    this.curIterationCount = 0;
  }

  draw(imageData: ImageData): void {
    let ctx: CanvasRenderingContext2D = this.canvasRef.nativeElement.getContext('2d');

    let cw: number = this.canvasRef.nativeElement.width;
    let ch: number = this.canvasRef.nativeElement.height;

    //console.log("Drawing on canvas with W = " + cw + " H = " + ch);

    if (cw !== this.canvasSize.width || ch !== this.canvasSize.height) {
      console.log('Draw detects that our canvas size has changed since intialization.')
    }

    if (imageData.width !== cw) {
      console.log('Draw is being called with ImageData whose width does not equal our canvas size.');
    }

    if (imageData.height !== ch) {
      console.log('Draw is being called with ImageData whose heigth does not equal our canvas size.');
    }

    ctx.fillStyle = '#DD0031';
    ctx.clearRect(0, 0, cw, ch);

    //console.log("Got ctx.");
    ctx.putImageData(imageData, 0, 0);
    //console.log("Updated canvas.");
  }

  ngOnInit(): void {
    if (!this.componentInitialized) {
      this.componentInitialized = true;
      //console.log("We are inited.");
      //this.initWebWorker();
    }
    else {
      //console.log('We are being inited, but ngOnInit has already been called.');
    }
  }

  ngOnChanges() {
    if (this.viewInitialized) {
      console.log("m-map-display.component is handling ngOnChanges -- the view has NOT been initialized.");
    }
    else {
      console.log("m-map-display.component is handling ngOnChanges -- the view has been initialized.");
    }
  }

  ngAfterViewInit() {
    if (!this.viewInitialized) {
      this.viewInitialized = true;
      console.log("Initializing the canvas size and building the Map Working Data here once because we are finally ready.");

      // Get the size of our canvas.
      this.canvasSize = this.initMapDisplay();
      console.log("The initial canvas size is W = " + this.canvasSize.width + " H = " + this.canvasSize.height);

      const topRight: IPoint = new Point(1, 1);
      const bottomLeft: IPoint = new Point(-2, -1);
      const maxInterations = 1000;
      const mi: IMapInfo = new MapInfo(bottomLeft, topRight, maxInterations);

      this.workers = new Array<Worker>(1);
      
      this.workers[0] = this.initWebWorker(this.canvasSize, mi);

      this.curIterationCount = 100;
      this.workers[0].postMessage('Iterate');
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

  //// Worker stuff
  private initWebWorker(canvasSize: ICanvasSize, mapInfo: IMapInfo): Worker {
    let webWorker = new Worker('/assets/worker.js');

    webWorker.addEventListener("message", (evt) => {
      let plainMsg: IWebWorkerMessage = WebWorkerMessage.FromEventData(evt.data);
      console.log('Received message from a web worker, The message = ' + plainMsg.messageKind + '.');

      if (plainMsg.messageKind === 'UpdatedMapData') {
        let updatedMapDataMsg = WebWorkerMapUpdateResponse.FromEventData(evt.data);
        let imageData = updatedMapDataMsg.getImageData(this.canvasSize);

        //let workerId: number = updatedMapDataMsg.workerId;
        let workerId: number = 0;

        this.draw(imageData);

        if (this.curIterationCount-- > 0) {
          this.workers[workerId].postMessage('Iterate');
        }
      }
    });

    let startRequestMsg = WebWorkerStartRequest.ForStart(canvasSize, mapInfo);
    webWorker.postMessage(startRequestMsg);

    return webWorker;


  }

  // OLD STUFF
    //private buildWorkingData(canvasSize: ICanvasSize): IMapWorkingData {

  //  const topRight: IPoint = new Point(1, 1);
  //  const bottomLeft: IPoint = new Point(-2, -1);

  //  const maxInterations = 1000;

  //  const mi: IMapInfo = new MapInfo(bottomLeft, topRight, maxInterations);

  //  const workingData = this.mService.createMapWD(canvasSize, mi);

  //  return workingData;
  //}


  //private progresslvy(): void {

  //  const that = this;

  //  let iterCount = 100;
  //  const intId = setInterval(doOneAndDraw, 5);

  //  function doOneAndDraw() {
  //    if (iterCount > 0) {
  //      iterCount--;

  //      that.workers[0].postMessage('Iterate');
  //      //that.doInterations(1);
  //      //that.draw();

  //    } else {
  //      clearInterval(intId);
  //    }
  //  }
  //}

}
