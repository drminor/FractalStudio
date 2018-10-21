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
  private mapInfo: IMapInfo;
  //private workingData: IMapWorkingData;

  // Array of WebWorkers
  private workers: Worker[];
  private numberOfSections: number;
  private sections: IMapWorkingData[];

  //private curIterationCount: number;

  constructor(private logger: Logger, private mService: MMapService) {
    this.componentInitialized = false;
    this.viewInitialized = false;

    // Set the number of sections to 4 - because we have 4 logical processors.
    this.numberOfSections = 4;

    // Define our MapInfo -- will be provided as input soon.
    const bottomLeft: IPoint = new Point(-1, -1);
    const topRight: IPoint = new Point(0.5, 0);
    const maxInterations = 1000;
    this.mapInfo = new MapInfo(bottomLeft, topRight, maxInterations);

    //this.workingData = null;
    this.workers = [];
    this.sections = [];

    //this.curIterationCount = 0;
  }

  draw(imageData: ImageData, sectionNumber: number): void {
    let ctx: CanvasRenderingContext2D = this.canvasRef.nativeElement.getContext('2d');

    let cw: number = this.canvasRef.nativeElement.width;
    let ch: number = this.canvasRef.nativeElement.height;

    //console.log("Drawing on canvas with W = " + cw + " H = " + ch);

    let mapWorkingData: IMapWorkingData = this.sections[sectionNumber];

    if (cw !== this.canvasSize.width || ch !== this.canvasSize.height) {
      console.log('Draw detects that our canvas size has changed since intialization.')
    }

    // Check the image data's width to the canvas width for this section.
    if (imageData.width !== mapWorkingData.canvasSize.width) {
      console.log('Draw is being called with ImageData whose width does not equal canvas width for section number ' + sectionNumber + '.');
    }

    //let chSection: number = this.canvasSize.height / 4;
    //let cy = chSection * sectionNumber;

    // Check the image data's height to the canvas height for this section.
    if (imageData.height !== mapWorkingData.canvasSize.height) {
      console.log('Draw is being called with ImageData whose height does not equal the canvas height for section number ' + sectionNumber + '.');
    }

    let bot: number = mapWorkingData.mapInfo.bottomLeft.y;
    let left: number = mapWorkingData.mapInfo.bottomLeft.x;

    ctx.fillStyle = '#DD0031';
    ctx.clearRect(left, bot, imageData.width, imageData.height);

    ctx.putImageData(imageData, left, bot);
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

      // Now that we know the size of our canvas,
      //// Build mapWorkingData for the entire map.
      //let mapWorkingData = new MapWorkingData(this.canvasSize, this.mapInfo);

      // Create a MapWorkingData for each section.
      this.sections = MapWorkingData.getWorkingDataSections(this.canvasSize, this.mapInfo, this.numberOfSections);

      // initialized our workers array (this.workers)
      this.workers = this.initWebWorkers(this.numberOfSections);
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

  // Worker stuff
  private initWebWorkers(numberOfSections: number): Worker[] {

    let result: Worker[] = new Array<Worker>(numberOfSections);

    let ptr: number = 0;

    for (ptr = 0; ptr < numberOfSections; ptr++) {
      let webWorker = new Worker('/assets/worker.js');
      this.workers[ptr] = webWorker;

      webWorker.addEventListener("message", (evt) => {
        let plainMsg: IWebWorkerMessage = WebWorkerMessage.FromEventData(evt.data);
        if (plainMsg.messageKind === 'UpdatedMapData') {
          let updatedMapDataMsg = WebWorkerMapUpdateResponse.FromEventData(evt.data);
          let sectionNumber: number = updatedMapDataMsg.sectionNumber;

          console.log('Received ' + plainMsg.messageKind + ' with section number = ' + sectionNumber + ' from a web worker.');

          let mapInfo: IMapWorkingData = this.sections[sectionNumber];
          let imageData: ImageData = updatedMapDataMsg.getImageData(mapInfo.canvasSize);

          this.draw(imageData, sectionNumber);

          if (mapInfo.curInterations++ < 100) {
            this.workers[sectionNumber].postMessage('Iterate');
          }
        }
        else {
          console.log('Received message from a web worker, The message = ' + plainMsg.messageKind + '.');
        }
      });

      let startRequestMsg = WebWorkerStartRequest.ForStart(this.sections[ptr].canvasSize, this.sections[ptr].mapInfo, ptr);
      webWorker.postMessage(startRequestMsg);

      this.sections[ptr].curInterations++;
      webWorker.postMessage("Iterate");
    }

    return result;
  }

  // OLD STUFF
    //private buildWorkingData(canvasSize: ICanvasSize): IMapWorkingData {

  //  const topRight: IPoint = new Point(1, 1);
  // const bottomLeft: IPoint = new Point(-2, -1);

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
